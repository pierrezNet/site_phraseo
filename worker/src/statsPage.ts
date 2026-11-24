/**
 * Page « Consommation voix » (GET /stats du relais) : totaux anonymes du jour et des 30 derniers jours,
 * quota global, et estimation de ce qui reste chez les fournisseurs (Workers AI, Azure).
 * Fonction pure : HTML autonome, sans script ni dépendance.
 */
import { NEURONS_PER_MINUTE, TTS_VOICES, type QuotaLimits, type VoiceStatsDay } from './relay';

export interface StatsData {
  days: VoiceStatsDay[];
  today: { global: number; users: number };
  limits: QuotaLimits;
}

/** Gratuités des fournisseurs (à revoir si les offres changent) */
export const FREE_TIERS = { workersAiNeuronsPerDay: 10_000, azureCharsPerMonth: 500_000 } as const;

const int = (n: number) => Math.round(n).toLocaleString('fr-FR');
const pct = (used: number, max: number) => (max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0);

/** Neurones Workers AI estimés d'un jour : voix anglaises (au caractère) et transcriptions (à la minute) */
export function workersAiNeurons(m: Record<string, number>): number {
  return (m.tts_en_chars ?? 0) * TTS_VOICES.en.neuronsPerChar + ((m.stt_seconds ?? 0) / 60) * NEURONS_PER_MINUTE.stt;
}

function bar(label: string, used: number, max: number, unit: string): string {
  const p = pct(used, max);
  const tone = p >= 90 ? 'high' : p >= 60 ? 'mid' : 'low';
  return `<div class="gauge">
  <div class="gauge-head"><span>${label}</span><span>${int(used)} / ${int(max)} ${unit} · ${p} %</span></div>
  <div class="gauge-track"><div class="gauge-fill ${tone}" style="width:${p}%"></div></div>
</div>`;
}

const card = (label: string, value: string, hint = '') =>
  `<div class="card"><div class="card-label">${label}</div><div class="card-value">${value}</div>${hint ? `<div class="card-hint">${hint}</div>` : ''}</div>`;

export function statsPage({ days, today, limits }: StatsData, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  const t = days.find((d) => d.day === day)?.metrics ?? {};
  const lines = (m: Record<string, number>) => (m.tts_fr_lines ?? 0) + (m.tts_en_lines ?? 0);
  const azureMonth = days.filter((d) => d.day.startsWith(month)).reduce((s, d) => s + (d.metrics.tts_fr_chars ?? 0), 0);

  const rows = days
    .map(
      ({ day: d, metrics: m }) => `<tr>
  <td>${d}</td><td>${int(m.users ?? 0)}</td><td>${int(m.tts_fr_lines ?? 0)}</td><td>${int(m.tts_en_lines ?? 0)}</td>
  <td>${int(m.tts_cache ?? 0)}</td><td>${int(m.stt_count ?? 0)}</td><td>${int(m.units ?? 0)}</td>
</tr>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Consommation voix — Phraséo</title>
<style>
  :root { color-scheme: light dark; --bg:#f8fafc; --fg:#1e293b; --muted:#64748b; --card:#fff; --line:#e2e8f0; --accent:#2563eb; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f172a; --fg:#f1f5f9; --muted:#94a3b8; --card:#1e293b; --line:#334155; --accent:#38bdf8; } }
  * { box-sizing: border-box; }
  body { margin:0; font:15px/1.5 system-ui, sans-serif; background:var(--bg); color:var(--fg); }
  main { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { font-size: 1.5rem; margin: 0 0 4px; }
  h2 { font-size: 1.1rem; margin: 28px 0 12px; }
  .sub { color: var(--muted); margin: 0; }
  .cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px 14px; }
  .card-label { color:var(--muted); font-size:.85rem; }
  .card-value { font-size:1.6rem; font-weight:700; }
  .card-hint { color:var(--muted); font-size:.8rem; }
  .gauge { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px 14px; margin-bottom:10px; }
  .gauge-head { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; font-size:.9rem; margin-bottom:8px; }
  .gauge-track { height:10px; border-radius:999px; background:var(--line); overflow:hidden; }
  .gauge-fill { height:100%; }
  .low { background:#22c55e; } .mid { background:#f59e0b; } .high { background:#ef4444; }
  .table-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:10px; }
  th, td { padding:6px 10px; text-align:right; border-bottom:1px solid var(--line); white-space:nowrap; }
  th:first-child, td:first-child { text-align:left; }
  th { color:var(--muted); font-weight:600; font-size:.85rem; }
  .note { color:var(--muted); font-size:.85rem; margin-top:16px; }
</style>
</head>
<body>
<main>
  <h1>Consommation voix</h1>
  <p class="sub">Phraséo · aujourd'hui ${day} (UTC) · mis à jour à ${now.toISOString().slice(11, 16)} UTC</p>

  <h2>Aujourd'hui</h2>
  <div class="cards">
    ${card('Personnes', int(today.users), 'navigateurs ayant consommé du quota')}
    ${card('Répliques dites', int(lines(t)), `${int(t.tts_fr_lines ?? 0)} en français · ${int(t.tts_en_lines ?? 0)} en anglais`)}
    ${card('Depuis le cache', int(t.tts_cache ?? 0), 'répliques déjà produites, gratuites')}
    ${card('Réponses transcrites', int(t.stt_count ?? 0), `${int(t.stt_seconds ?? 0)} s d'audio`)}
  </div>

  <h2>Quotas</h2>
  ${bar('Quota global du jour', today.global, limits.global, 'unités')}
  ${bar('Workers AI (voix anglaises et transcription), estimation du jour', workersAiNeurons(t), FREE_TIERS.workersAiNeuronsPerDay, 'neurones gratuits')}
  ${bar('Azure (voix françaises), caractères du mois', azureMonth, FREE_TIERS.azureCharsPerMonth, 'caractères gratuits')}
  <p class="note">Plafond par personne : ${int(limits.user)} unités par jour (≈ ${int(limits.user / (100 * TTS_VOICES.en.neuronsPerChar))} répliques anglaises
  ou ${int(limits.user / (100 * TTS_VOICES.fr.neuronsPerChar))} françaises de 100 caractères) · par adresse IP : ${int(limits.ip)} unités.</p>

  <h2>30 derniers jours</h2>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Jour</th><th>Personnes</th><th>Répliques FR</th><th>Répliques EN</th><th>Cache</th><th>Transcriptions</th><th>Unités</th></tr></thead>
    <tbody>
${rows || '<tr><td colspan="7">Aucune donnée pour le moment.</td></tr>'}
    </tbody>
  </table>
  </div>
  <p class="note">Totaux anonymes : aucun identifiant ni adresse IP n'est conservé au-delà de la journée.
  Les consommations des fournisseurs sont des estimations faites par le relais ; les factures font foi.</p>
</main>
</body>
</html>`;
}
