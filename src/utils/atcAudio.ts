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

/**
 * Débit de lecture (MeloTTS n'a ni réglage de vitesse ni de style) :
 * voix française un peu plate → accélérée pour plus de dynamisme ; anglaise trop rapide → ralentie
 */
const PLAYBACK_RATE: Record<'fr' | 'en', number> = { fr: 1.1, en: 0.88 };

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
 * Joue un MP3 comme à la radio : bande passante VHF 300–3400 Hz, niveau compressé.
 * Lecteur HTML (et non AudioBuffer) pour ralentir sans changer la hauteur de la voix.
 */
export async function playRadio(mp3: ArrayBuffer, lang: 'fr' | 'en'): Promise<void> {
  stopRadio();
  context ??= new AudioContext();
  if (context.state === 'suspended') await context.resume();

  const url = URL.createObjectURL(new Blob([mp3], { type: 'audio/mpeg' }));
  const audio = new Audio(url);
  audio.playbackRate = PLAYBACK_RATE[lang];
  audio.preservesPitch = true;

  const highpass = new BiquadFilterNode(context, { type: 'highpass', frequency: 300 });
  const lowpass = new BiquadFilterNode(context, { type: 'lowpass', frequency: 3400 });
  const compressor = new DynamicsCompressorNode(context, { threshold: -24, ratio: 6 });
  context.createMediaElementSource(audio).connect(highpass).connect(lowpass).connect(compressor).connect(context.destination);

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
