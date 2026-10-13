/**
 * Page d'enregistrement du banc vocal (servie par le serveur de développement uniquement :
 * http://localhost:5173/bench/voice/recorder.html). Écrit les WAV et manifest.json dans
 * un dossier local via l'API File System Access (Chrome / Chromium / Edge).
 */
import { collectCandidates } from './collect';
import { pickPhrases, type BenchPhrase } from './phrases';
import { toWav } from './wav';

const COUNTS = { fr: 35, en: 15 };

interface ManifestEntry extends BenchPhrase {
  file: string;
  durationMs: number;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const phrases = pickPhrases(collectCandidates(), COUNTS);
const recorded = new Map<string, { entry: ManifestEntry; wav: Blob }>();
let index = 0;
let folder: FileSystemDirectoryHandle | null = null;
let recorder: MediaRecorder | null = null;
/** Prise en cours (enregistrement puis conversion et sauvegarde) : navigation bloquée */
let busy = false;

const status = (text: string, cls = '') => {
  $('status').textContent = text;
  $('status').className = `status ${cls}`;
};

function render() {
  const p = phrases[index];
  $('counter').textContent = `Phrase ${index + 1} / ${phrases.length} · ${p.lang.toUpperCase()}`;
  $('context').textContent = `${p.mode} · ${p.step}`;
  $('phrase').textContent = `« ${p.display} »`;
  $('criticals').textContent = p.criticals.length ? `Éléments critiques : ${p.criticals.map((c) => c.value).join(' · ')}` : '';
  ($('talk') as HTMLButtonElement).disabled = !folder;
  ($('play') as HTMLButtonElement).disabled = !recorded.has(p.id);
  ($('prev') as HTMLButtonElement).disabled = busy || index === 0;
  ($('next') as HTMLButtonElement).disabled = busy || index === phrases.length - 1;
  $('bar').style.width = `${(recorded.size / phrases.length) * 100}%`;
  $('list').innerHTML = phrases
    .map((q, i) => `<li class="${recorded.has(q.id) ? 'done' : ''} ${i === index ? 'current' : ''}">${q.id} — ${q.step}</li>`)
    .join('');
  if (!folder && !$('status').classList.contains('ko')) status('Choisissez d’abord le dossier d’enregistrement.');
}

async function writeFile(name: string, data: Blob | string) {
  const handle = await folder!.getFileHandle(name, { create: true });
  const stream = await handle.createWritable();
  await stream.write(data);
  await stream.close();
}

async function saveManifest() {
  const entries = phrases.filter((p) => recorded.has(p.id)).map((p) => recorded.get(p.id)!.entry);
  await writeFile('manifest.json', JSON.stringify(entries, null, 2));
}

/** Reprend un dossier déjà commencé : les prises existantes ne sont pas à refaire */
async function loadExisting() {
  try {
    const file = await (await folder!.getFileHandle('manifest.json')).getFile();
    const entries = JSON.parse(await file.text()) as ManifestEntry[];
    for (const entry of entries) {
      const wav = await (await folder!.getFileHandle(entry.file)).getFile();
      if (phrases.some((p) => p.id === entry.id)) recorded.set(entry.id, { entry, wav });
    }
    if (entries.length) status(`${entries.length} prise(s) déjà présente(s) dans ce dossier.`, 'ok');
  } catch {
    // pas encore de manifeste : nouveau dossier
  }
}

$('pick').addEventListener('click', async () => {
  if (!('showDirectoryPicker' in window)) {
    status('Ce navigateur ne permet pas d’écrire dans un dossier : utilisez Chrome, Chromium ou Edge.', 'ko');
    return;
  }
  const picked = await (window as unknown as { showDirectoryPicker: (o: object) => Promise<FileSystemDirectoryHandle> })
    .showDirectoryPicker({ mode: 'readwrite' });
  // Le navigateur peut laisser choisir un dossier où il n'a pas le droit d'écrire
  // (Chromium en snap : seulement le répertoire personnel) → on le vérifie tout de suite
  try {
    const probe = await picked.getFileHandle('.test-ecriture', { create: true });
    const stream = await probe.createWritable();
    await stream.write('ok');
    await stream.close();
    await picked.removeEntry('.test-ecriture');
  } catch {
    folder = null;
    $('folder').textContent = 'Aucun dossier choisi';
    status(
      `Impossible d’écrire dans « ${picked.name} ». Si votre navigateur est installé en snap (Chromium), il ne peut écrire que dans votre dossier personnel : ` +
        'choisissez par exemple ~/Documents/phraseo-voix, puis lancez le banc avec BENCH_RECORDINGS=~/Documents/phraseo-voix npm run bench:voice.',
      'ko'
    );
    render();
    return;
  }
  folder = picked;
  $('folder').textContent = `Dossier : ${folder.name}`;
  await loadExisting();
  render();
});

async function startRecording() {
  if (!folder || recorder || busy) return;
  busy = true;
  // La phrase est fixée à l'appui : changer de phrase pendant la sauvegarde ne doit pas la déplacer
  const p = phrases[index];
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  } catch (err) {
    busy = false;
    return status(`Micro inaccessible : ${err instanceof Error ? err.message : err}`, 'ko');
  }
  const chunks: Blob[] = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    recorder = null;
    $('talk').classList.remove('recording');
    try {
      const { wav, durationMs } = await toWav(new Blob(chunks, { type: chunks[0]?.type }));
      if (durationMs < 500) return status('Prise trop courte : maintenez le bouton pendant toute la phrase.', 'ko');
      const entry: ManifestEntry = { ...p, file: `${p.id}.wav`, durationMs };
      await writeFile(entry.file, wav);
      recorded.set(p.id, { entry, wav });
      await saveManifest();
      status(`✓ ${p.id} enregistrée (${(durationMs / 1000).toFixed(1)} s).`, 'ok');
      render();
    } catch (err) {
      status(`Échec de l’enregistrement : ${err instanceof Error ? err.message : err}`, 'ko');
    } finally {
      busy = false;
      render();
    }
  };
  recorder.start();
  $('talk').classList.add('recording');
  status('🔴 Enregistrement… relâchez à la fin de la phrase.');
}

const stopRecording = () => recorder?.state === 'recording' && recorder.stop();

const talk = $('talk');
talk.addEventListener('pointerdown', startRecording);
talk.addEventListener('pointerup', stopRecording);
talk.addEventListener('pointerleave', stopRecording);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat) { e.preventDefault(); startRecording(); }
  if (e.code === 'ArrowRight') $('next').click();
  if (e.code === 'ArrowLeft') $('prev').click();
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space') stopRecording(); });

$('play').addEventListener('click', () => {
  const take = recorded.get(phrases[index].id);
  if (take) new Audio(URL.createObjectURL(take.wav)).play();
});
$('prev').addEventListener('click', () => { if (!busy && index > 0) { index--; render(); } });
$('next').addEventListener('click', () => { if (!busy && index < phrases.length - 1) { index++; render(); } });

render();
