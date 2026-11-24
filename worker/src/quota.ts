/**
 * Compteur des quotas voix : une instance unique (idFromName('global')), donc des incréments atomiques.
 * Usage du jour (UTC) en neurones estimés, par utilisateur anonyme, par IP et au total.
 * Les compteurs d'un jour (identifiants et IP compris) sont effacés à minuit UTC par une alarme.
 * Statistiques quotidiennes anonymes (totaux, nombre de personnes, sans identifiant) gardées STATS_DAYS jours.
 */
import { DurableObject } from 'cloudflare:workers';
import { quotaDay, quotaVerdict, STATS_DAYS, type QuotaLimits, type QuotaScope, type QuotaUsage, type QuotaVerdict, type VoiceStatsDay } from './relay';

export class VoiceQuota extends DurableObject<Record<string, unknown>> {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS usage (
         day TEXT NOT NULL, scope TEXT NOT NULL, id TEXT NOT NULL, neurons REAL NOT NULL,
         PRIMARY KEY (day, scope, id)
       )`
    );
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS stats (
         day TEXT NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL,
         PRIMARY KEY (day, metric)
       )`
    );
  }

  /** Ajoute aux statistiques du jour (ex. { tts_fr_lines: 1, tts_fr_chars: 84 }) */
  record(metrics: Record<string, number>, day = quotaDay()): void {
    for (const [metric, value] of Object.entries(metrics)) {
      if (!value) continue;
      this.ctx.storage.sql.exec(
        `INSERT INTO stats (day, metric, value) VALUES (?, ?, ?)
         ON CONFLICT (day, metric) DO UPDATE SET value = value + excluded.value`,
        day, metric, value
      );
    }
  }

  /** Statistiques des derniers jours (le plus récent d'abord) et usage global du jour */
  stats(days = 30): { days: VoiceStatsDay[]; today: { global: number; users: number } } {
    const rows = this.ctx.storage.sql
      .exec<{ day: string; metric: string; value: number }>(
        'SELECT day, metric, value FROM stats WHERE day >= ? ORDER BY day DESC',
        quotaDay(new Date(Date.now() - (days - 1) * 86_400_000))
      )
      .toArray();
    const byDay = new Map<string, VoiceStatsDay>();
    for (const { day, metric, value } of rows) {
      const entry = byDay.get(day) ?? { day, metrics: {} };
      entry.metrics[metric] = value;
      byDay.set(day, entry);
    }
    const today = quotaDay();
    const users = this.ctx.storage.sql
      .exec<{ n: number }>("SELECT COUNT(*) AS n FROM usage WHERE day = ? AND scope = 'user'", today)
      .toArray()[0]?.n ?? 0;
    return { days: [...byDay.values()], today: { global: this.usage(today, '', '').global, users } };
  }

  private usage(day: string, user: string, ip: string): QuotaUsage {
    const read = (scope: QuotaScope, id: string) =>
      this.ctx.storage.sql
        .exec<{ neurons: number }>('SELECT neurons FROM usage WHERE day = ? AND scope = ? AND id = ?', day, scope, id)
        .toArray()[0]?.neurons ?? 0;
    return { user: read('user', user), ip: read('ip', ip), global: read('global', '*') };
  }

  /** Avant une synthèse ou une transcription : la voix est-elle encore permise ? */
  check(user: string, ip: string, limits: QuotaLimits): QuotaVerdict {
    return quotaVerdict(this.usage(quotaDay(), user, ip), limits);
  }

  /** Après coup : décompte des neurones consommés (et des statistiques du jour), puis part restante */
  async charge(user: string, ip: string, neurons: number, limits: QuotaLimits, metrics: Record<string, number> = {}): Promise<QuotaVerdict> {
    const day = quotaDay();
    // Première consommation du jour de cet utilisateur : une personne de plus dans les statistiques
    const known = this.ctx.storage.sql
      .exec("SELECT 1 FROM usage WHERE day = ? AND scope = 'user' AND id = ?", day, user)
      .toArray().length > 0;
    this.record({ ...metrics, units: neurons, users: known ? 0 : 1 }, day);
    for (const [scope, id] of [['user', user], ['ip', ip], ['global', '*']] as const) {
      this.ctx.storage.sql.exec(
        `INSERT INTO usage (day, scope, id, neurons) VALUES (?, ?, ?, ?)
         ON CONFLICT (day, scope, id) DO UPDATE SET neurons = neurons + excluded.neurons`,
        day, scope, id, neurons
      );
    }
    // Les jours passés ne servent plus ; effacement garanti à minuit UTC, même sans nouvel usage
    this.ctx.storage.sql.exec('DELETE FROM usage WHERE day < ?', day);
    this.ctx.storage.sql.exec('DELETE FROM stats WHERE day < ?', quotaDay(new Date(Date.now() - STATS_DAYS * 86_400_000)));
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(nextUtcMidnight());
    const verdict = quotaVerdict(this.usage(day, user, ip), limits);
    // Le décompte peut franchir le plafond : la réplique est jouée, la suivante sera refusée
    return { allowed: true, left: verdict.left };
  }

  /** Minuit UTC : effacement des compteurs de la veille (identifiants anonymes et adresses IP) */
  async alarm(): Promise<void> {
    this.ctx.storage.sql.exec('DELETE FROM usage WHERE day < ?', quotaDay());
  }
}

/** Prochain minuit UTC (début du jour de quota suivant), en millisecondes */
function nextUtcMidnight(now = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}
