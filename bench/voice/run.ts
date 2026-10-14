/**
 * Banc vocal : envoie les enregistrements aux moteurs et produit un rapport.
 *
 *   npm run bench:voice                     # tous les moteurs configurés
 *   npm run bench:voice -- azure mistral    # moteurs choisis
 *
 * Clés dans bench/voice/.env.bench (voir .env.bench.example), enregistrements dans
 * bench/voice/recordings (page recorder.html). Rapport dans bench/voice/results.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINES, HttpError } from './engines';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Appel avec nouvel essai si le service refuse pour quota (429), avec attente croissante */
async function withRetry<T>(call: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await call();
    } catch (err) {
      if (!(err instanceof HttpError && err.status === 429) || i >= attempts) throw err;
      await sleep(1500 * 2 ** (i - 1));
    }
  }
}
import { markdownReport, type Take, type Trial } from './report';
import { vocabulary } from '../../src/utils/sttVocabulary';

const here = dirname(fileURLToPath(import.meta.url));
const envFile = join(here, '.env.bench');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const args = process.argv.slice(2);
const results = process.env.BENCH_RESULTS ?? join(here, 'results');

// --rescore [fichier] : renote des transcriptions déjà obtenues, sans rappeler les moteurs
if (args[0] === '--rescore') {
  const file = args[1] ?? join(results, (await readdir(results)).filter((f) => f.startsWith('trials-')).sort().at(-1)!);
  const previous = JSON.parse(await readFile(file, 'utf8')) as Trial[];
  const used = ENGINES.filter((e) => previous.some((t) => t.engine === e.id));
  const report = markdownReport(previous, used);
  await writeFile(file.replace('trials-', 'rapport-').replace(/\.json$/, '-renote.md'), report);
  console.log(`Renotation de ${file}\n\n${report.split('\n## ')[0]}`);
  process.exit(0);
}

// Dossiers modifiables (tests, autre voix) : BENCH_RECORDINGS, BENCH_RESULTS
const recordings = process.env.BENCH_RECORDINGS ?? join(here, 'recordings');
const manifest = JSON.parse(await readFile(join(recordings, 'manifest.json'), 'utf8')) as (Take & { file: string })[];

// Vocabulaire par langue : fonds aéronautique + noms propres des phrases enregistrées
const vocab = {
  fr: vocabulary('fr', manifest.filter((t) => t.lang === 'fr').map((t) => t.expected)),
  en: vocabulary('en', manifest.filter((t) => t.lang === 'en').map((t) => t.expected)),
};

const wanted = args;
const engines = ENGINES.filter((e) => (wanted.length ? wanted.includes(e.id) : true)).filter((e) => {
  const missing = e.env.filter((name) => !process.env[name]);
  if (missing.length) console.log(`⏭  ${e.label} : ignoré (manque ${missing.join(', ')})`);
  return !missing.length;
});

const trials: Trial[] = [];
for (const engine of engines) {
  console.log(`\n▶ ${engine.label}`);
  for (const take of manifest) {
    if (engine.minIntervalMs) await sleep(engine.minIntervalMs);
    try {
      // Latence mesurée sur l'appel réussi (hors attentes de quota)
      let latencyMs = 0;
      const transcript = await withRetry(async () => {
        const started = Date.now();
        const text = await engine.transcribe(join(recordings, take.file), take.lang, take.expected, vocab[take.lang]);
        latencyMs = Date.now() - started;
        return text;
      });
      trials.push({ engine: engine.id, take, transcript, latencyMs });
      process.stdout.write('.');
    } catch (err) {
      trials.push({ engine: engine.id, take, transcript: '', latencyMs: 0, error: err instanceof Error ? err.message : String(err) });
      process.stdout.write('✗');
    }
  }
}

await mkdir(results, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
await writeFile(join(results, `trials-${stamp}.json`), JSON.stringify(trials, null, 2));
const report = markdownReport(trials, engines);
await writeFile(join(results, `rapport-${stamp}.md`), report);
console.log(`\n\n${report.split('\n## ')[0]}\n\nRapport complet : ${join(results, `rapport-${stamp}.md`)}`);
