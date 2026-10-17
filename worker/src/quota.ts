/**
 * Compteur des quotas voix : une instance unique (idFromName('global')), donc des incréments atomiques.
 * Usage du jour (UTC) en neurones estimés, par utilisateur anonyme, par IP et au total.
 * Les compteurs d'un jour (identifiants et IP compris) sont effacés à minuit UTC par une alarme.
 */
import { DurableObject } from 'cloudflare:workers';
import { quotaDay, quotaVerdict, type QuotaLimits, type QuotaScope, type QuotaUsage, type QuotaVerdict } from './relay';

export class VoiceQuota extends DurableObject<Record<string, unknown>> {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS usage (
         day TEXT NOT NULL, scope TEXT NOT NULL, id TEXT NOT NULL, neurons REAL NOT NULL,
         PRIMARY KEY (day, scope, id)
       )`
    );
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

  /** Après coup : décompte des neurones consommés, puis part restante */
  async charge(user: string, ip: string, neurons: number, limits: QuotaLimits): Promise<QuotaVerdict> {
    const day = quotaDay();
    for (const [scope, id] of [['user', user], ['ip', ip], ['global', '*']] as const) {
      this.ctx.storage.sql.exec(
        `INSERT INTO usage (day, scope, id, neurons) VALUES (?, ?, ?, ?)
         ON CONFLICT (day, scope, id) DO UPDATE SET neurons = neurons + excluded.neurons`,
        day, scope, id, neurons
      );
    }
    // Les jours passés ne servent plus ; effacement garanti à minuit UTC, même sans nouvel usage
    this.ctx.storage.sql.exec('DELETE FROM usage WHERE day < ?', day);
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
