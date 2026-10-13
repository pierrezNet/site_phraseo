/**
 * Voix des répliques : audio MeloTTS obtenu via le relais (POST /tts), joué avec un effet radio.
 * Le relais décompte un quota voix quotidien par navigateur (identifiant anonyme).
 */
import { API_BASE } from './relay';
import { fetchWithTimeout } from './api';

/** WAV d'environ 500 Ko par réplique : cache de session limité */
const MAX_CACHED = 30;
const USER_ID_KEY = 'voiceUserId';

export type QuotaScope = 'user' | 'ip' | 'global';

/** Quota voix du jour atteint (relais : 429 avec `quota`) */
export class VoiceQuotaError extends Error {
  constructor(public scope: QuotaScope) {
    super(`Quota voix atteint (${scope})`);
  }
}

let sessionUserId: string | null = null;

/** Identifiant anonyme du navigateur pour le quota voix (aucune donnée personnelle) */
function voiceUserId(): string {
  try {
    const stored = localStorage.getItem(USER_ID_KEY);
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
    return id;
  } catch {
    // Stockage indisponible (navigation privée stricte) : identifiant de session
    return (sessionUserId ??= crypto.randomUUID());
  }
}

/** Audio déjà demandé pendant la session (le relais le garde aussi en cache 30 jours) */
const cache = new Map<string, Promise<ArrayBuffer>>();

/**
 * Audio d'une réplique. `onQuota` reçoit la part de quota restante (0–1) après une synthèse facturée
 * (pas pour une réplique déjà en cache).
 */
export function fetchAtcAudio(text: string, lang: 'fr' | 'en', onQuota?: (left: number) => void): Promise<ArrayBuffer> {
  const key = `${lang}\n${text}`;
  let audio = cache.get(key);
  if (!audio) {
    audio = fetchWithTimeout(`${API_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Phraseo-User': voiceUserId() },
      body: JSON.stringify({ text, lang }),
      timeout: 15000,
    }).then(async (res) => {
      if (res.status === 429) {
        const body = (await res.json().catch(() => ({}))) as { quota?: QuotaScope };
        if (body.quota) throw new VoiceQuotaError(body.quota);
      }
      if (!res.ok) throw new Error(`Synthèse vocale : HTTP ${res.status}`);
      const left = Number(res.headers.get('X-Voice-Quota-Left'));
      if (res.headers.has('X-Voice-Quota-Left') && Number.isFinite(left)) onQuota?.(left);
      return res.arrayBuffer();
    });
    // Un échec n'est pas mémorisé : la réplique pourra être redemandée
    audio.catch(() => cache.delete(key));
    cache.set(key, audio);
    if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value!);
  }
  return audio;
}

export type Speaker = 'atc' | 'pilot';

/**
 * Rendu de chaque interlocuteur (MeloTTS n'a qu'une voix par langue, sans réglage de vitesse ni de style) :
 * - ATC : radio de la tour, débit retouché sans changer la hauteur (FR un peu plate → accélérée, EN trop rapide → ralentie)
 * - pilote : hauteur non conservée, donc ralentir rend la voix aussi plus grave ;
 *   radio de bord un peu moins bonne (bande plus étroite, légère saturation)
 */
const VOICES: Record<Speaker, { rate: Record<'fr' | 'en', number>; preservesPitch: boolean; band: [number, number]; drive: number }> = {
  atc: { rate: { fr: 1.1, en: 0.88 }, preservesPitch: true, band: [300, 3400], drive: 0 },
  pilot: { rate: { fr: 0.92, en: 0.86 }, preservesPitch: false, band: [450, 2800], drive: 3 },
};

/** Courbe de saturation douce (tanh) : 0 = aucune */
function saturationCurve(drive: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / Math.tanh(drive);
  }
  return curve;
}

let context: AudioContext | null = null;
let current: { audio: HTMLAudioElement; done: () => void } | null = null;

/** Arrête la réplique en cours (la promesse de playRadio se résout) */
export function stopRadio(): void {
  const playing = current;
  current = null;
  if (!playing) return;
  playing.audio.pause();
  playing.done();
}

/**
 * Joue un WAV comme à la radio (bande passante VHF, niveau compressé), avec le rendu de l'interlocuteur.
 * Lecteur HTML (et non AudioBuffer) pour régler débit et hauteur indépendamment.
 */
export async function playRadio(wav: ArrayBuffer, lang: 'fr' | 'en', speaker: Speaker = 'atc'): Promise<void> {
  stopRadio();
  context ??= new AudioContext();
  if (context.state === 'suspended') await context.resume();

  const voice = VOICES[speaker];
  const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
  const audio = new Audio(url);
  audio.playbackRate = voice.rate[lang];
  audio.preservesPitch = voice.preservesPitch;

  let chain: AudioNode = context.createMediaElementSource(audio);
  chain = chain.connect(new BiquadFilterNode(context, { type: 'highpass', frequency: voice.band[0] }));
  chain = chain.connect(new BiquadFilterNode(context, { type: 'lowpass', frequency: voice.band[1] }));
  if (voice.drive) chain = chain.connect(new WaveShaperNode(context, { curve: saturationCurve(voice.drive), oversample: '2x' }));
  chain.connect(new DynamicsCompressorNode(context, { threshold: -24, ratio: 6 })).connect(context.destination);

  return new Promise((resolve, reject) => {
    const done = () => {
      if (current?.audio === audio) current = null;
      URL.revokeObjectURL(url);
      resolve();
    };
    current = { audio, done };
    audio.onended = done;
    audio.play().catch((err) => {
      URL.revokeObjectURL(url);
      if (current?.audio === audio) current = null;
      reject(err);
    });
  });
}
