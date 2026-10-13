/**
 * Voix de l'ATC : audio MeloTTS obtenu via le relais (POST /tts), joué avec un effet radio VHF.
 */
import { API_BASE } from './relay';
import { fetchWithTimeout } from './api';

const MAX_CACHED = 60;

/** Audio déjà demandé pendant la session (le relais le garde aussi en cache 30 jours) */
const cache = new Map<string, Promise<ArrayBuffer>>();

export function fetchAtcAudio(text: string, lang: 'fr' | 'en'): Promise<ArrayBuffer> {
  const key = `${lang}\n${text}`;
  let audio = cache.get(key);
  if (!audio) {
    audio = fetchWithTimeout(`${API_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      timeout: 15000,
    }).then((res) => {
      if (!res.ok) throw new Error(`Synthèse vocale : HTTP ${res.status}`);
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
 * Joue un MP3 comme à la radio (bande passante VHF, niveau compressé), avec le rendu de l'interlocuteur.
 * Lecteur HTML (et non AudioBuffer) pour régler débit et hauteur indépendamment.
 */
export async function playRadio(mp3: ArrayBuffer, lang: 'fr' | 'en', speaker: Speaker = 'atc'): Promise<void> {
  stopRadio();
  context ??= new AudioContext();
  if (context.state === 'suspended') await context.resume();

  const voice = VOICES[speaker];
  const url = URL.createObjectURL(new Blob([mp3], { type: 'audio/mpeg' }));
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
