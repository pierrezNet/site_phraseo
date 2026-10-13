/**
 * Notation et synthèse du banc vocal (logique pure, testée dans report.test.ts).
 * La notation est celle du quiz : éléments critiques exigés, score ≥ 75 %.
 */
import { scoreAnswer, tokenize, type Critical } from '../../src/utils/quizScoring';
import { withSpelledRegistrations } from '../../src/utils/criticals';

/** Notation d'un essai, avec l'immatriculation épelée acceptée (manifestes antérieurs compris) */
const grade = (t: Trial) =>
  scoreAnswer(t.transcript, t.take.expected, t.take.criticals, withSpelledRegistrations(t.take.equivalences));

export interface Take {
  id: string;
  lang: 'fr' | 'en';
  expected: string;
  criticals: Critical[];
  equivalences: string[][];
  durationMs: number;
}

export interface Trial {
  engine: string;
  take: Take;
  transcript: string;
  latencyMs: number;
  error?: string;
}

export interface EngineSummary {
  engine: string;
  lang: 'fr' | 'en' | 'tous';
  takes: number;
  errors: number;
  /** Part des éléments critiques correctement reconnus */
  criticalAccuracy: number;
  /** Part des phrases qui seraient validées par le quiz */
  passRate: number;
  meanScore: number;
  meanLatencyMs: number;
  /** Taux d'erreur sur les mots (WER), sur les mots normalisés du quiz */
  wer: number;
  audioMinutes: number;
}

/** Distance d'édition entre deux suites de mots */
function wordDistance(a: string[], b: string[]): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

export function wer(expected: string, transcript: string): number {
  const e = tokenize(expected);
  return e.length ? wordDistance(e, tokenize(transcript)) / e.length : 0;
}

export function summarize(trials: Trial[], engine: string, lang: 'fr' | 'en' | 'tous'): EngineSummary {
  const mine = trials.filter((t) => t.engine === engine && (lang === 'tous' || t.take.lang === lang));
  const done = mine.filter((t) => !t.error);
  let criticalTotal = 0;
  let criticalOk = 0;
  let passed = 0;
  let scoreSum = 0;
  let werSum = 0;
  for (const t of done) {
    const result = grade(t);
    criticalTotal += result.criticals.length;
    criticalOk += result.criticals.filter((c) => c.ok).length;
    if (result.passed) passed++;
    scoreSum += result.score;
    werSum += wer(t.take.expected, t.transcript);
  }
  const n = done.length || 1;
  return {
    engine,
    lang,
    takes: mine.length,
    errors: mine.length - done.length,
    criticalAccuracy: criticalTotal ? criticalOk / criticalTotal : 0,
    passRate: passed / n,
    meanScore: scoreSum / n,
    meanLatencyMs: done.reduce((s, t) => s + t.latencyMs, 0) / n,
    wer: werSum / n,
    audioMinutes: mine.reduce((s, t) => s + t.take.durationMs, 0) / 60000,
  };
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

/** Rapport Markdown : synthèse par moteur et par langue, puis les éléments critiques manqués */
export function markdownReport(trials: Trial[], engines: { id: string; label: string; costPerMinute: number }[]): string {
  const lines = [
    `# Banc vocal — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    '',
    'Notation identique au quiz : une phrase est « validée » si tous ses éléments critiques sont reconnus et le score ≥ 75 %.',
    '',
    '| Moteur | Langue | Phrases | Critiques justes | Phrases validées | Score moyen | WER | Latence moy. | Coût du banc |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const e of engines) {
    for (const lang of ['fr', 'en', 'tous'] as const) {
      const s = summarize(trials, e.id, lang);
      if (!s.takes) continue;
      lines.push(
        `| ${e.label} | ${lang} | ${s.takes}${s.errors ? ` (${s.errors} erreurs)` : ''} | ${pct(s.criticalAccuracy)} | ${pct(s.passRate)} | ${Math.round(s.meanScore)} % | ${pct(s.wer)} | ${(s.meanLatencyMs / 1000).toFixed(1)} s | ${(s.audioMinutes * e.costPerMinute).toFixed(3)} $ |`
      );
    }
  }
  lines.push('', '## Éléments critiques non reconnus', '');
  for (const t of trials) {
    if (t.error) {
      lines.push(`- **${t.engine}** ${t.take.id} : erreur — ${t.error}`);
      continue;
    }
    const missed = grade(t).criticals.filter((c) => !c.ok);
    if (missed.length) {
      lines.push(`- **${t.engine}** ${t.take.id} : ${missed.map((c) => `${c.label} « ${c.value} »`).join(', ')} — entendu : « ${t.transcript} »`);
    }
  }
  return lines.join('\n');
}
