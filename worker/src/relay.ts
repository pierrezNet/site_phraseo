/**
 * Logique pure du relais (sans dépendance au runtime Workers) : testable avec Vitest.
 */

// ── METAR ────────────────────────────────────────────────────────────────────

/** Réponse de aviationweather.gov (NOAA), champs utilisés uniquement */
export interface NoaaMetar {
  icaoId: string;
  rawOb?: string;
  temp?: number | null;
  wdir?: number | string | null; // "VRB" possible
  wspd?: number | null;
  visib?: number | string | null; // miles terrestres, "10+" possible
  altim?: number | null; // hPa
}

/** Format attendu par le front (voir src/types/metar.ts) */
export interface Metar {
  station: string;
  raw: string;
  altimeter: { value: number | null };
  temperature: { value: number | null };
  wind_direction: { value: number | null };
  wind_speed: { value: number | null };
  visibility: { value: number | null };
}

export const ICAO_RE = /^[A-Z]{4}$/;

const STATUTE_MILE_M = 1609.344;

/** Visibilité NOAA (SM) → mètres, arrondie à la centaine ; "10+" → 9999 comme en METAR */
export function visibilityMeters(visib: NoaaMetar['visib']): number | null {
  if (visib === null || visib === undefined || visib === '') return null;
  if (typeof visib === 'string' && visib.endsWith('+')) return 9999;
  const sm = Number(visib);
  if (!Number.isFinite(sm)) return null;
  return Math.min(9999, Math.round((sm * STATUTE_MILE_M) / 100) * 100);
}

export function toMetar(n: NoaaMetar): Metar {
  return {
    station: n.icaoId,
    raw: n.rawOb ?? '',
    altimeter: { value: n.altim != null ? Math.round(n.altim) : null },
    temperature: { value: n.temp ?? null },
    // "VRB" → null : le front énonce alors « variable »
    wind_direction: { value: typeof n.wdir === 'number' ? n.wdir : null },
    wind_speed: { value: n.wspd ?? null },
    visibility: { value: visibilityMeters(n.visib) },
  };
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export const FEEDBACK_TYPES = [
  'Erreur de phraséologie',
  'Suggestion / idée',
  'Bug technique',
  'Autre',
] as const;

export interface Feedback {
  type: (typeof FEEDBACK_TYPES)[number];
  message: string;
  /** Pseudo publié avec le retour (facultatif) */
  pseudo: string;
  contact: string;
  mode: 'VFR' | 'IFR' | '';
  level: string;
  lang: 'fr' | 'en' | '';
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Valide le corps reçu ; renvoie null si invalide */
export function parseFeedback(body: unknown): Feedback | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  const type = str(b.type);
  const message = str(b.message);
  const contact = str(b.contact);
  const pseudo = str(b.pseudo).replace(/\s+/g, ' ');
  const mode = str(b.mode);
  const level = str(b.level);
  const lang = str(b.lang);

  if (!(FEEDBACK_TYPES as readonly string[]).includes(type)) return null;
  if (!message || message.length > 1800) return null;
  if (contact.length > 120 || pseudo.length > 40 || level.length > 20) return null;
  if (!['VFR', 'IFR', ''].includes(mode) || !['fr', 'en', ''].includes(lang)) return null;

  return { type: type as Feedback['type'], message, pseudo, contact, mode: mode as Feedback['mode'], level, lang: lang as Feedback['lang'] };
}

// ── Synthèse vocale (voix de l'ATC) ──────────────────────────────────────────

export const TTS_MAX_CHARS = 600;

export type TtsLang = 'fr' | 'en';
export type TtsSpeaker = 'atc' | 'pilot';
/** Voix féminine ou masculine (tirée au sort par le site pour chaque session) */
export type TtsGender = 'f' | 'm';

export interface TtsRequest {
  text: string;
  lang: TtsLang;
  /** Interlocuteur : une voix différente pour l'ATC et le pilote */
  speaker: TtsSpeaker;
  gender: TtsGender;
}

/** Voix de synthèse d'une langue : Workers AI, ou Azure AI Speech (clé en secret du Worker) */
export interface TtsVoice {
  provider: 'workers-ai' | 'azure';
  /** Modèle Workers AI, ou nom de la voix Azure pour le cache */
  model: string;
  /** Voix par interlocuteur et par genre (liste fermée : le site ne choisit que le genre) */
  speakers: Record<TtsSpeaker, Record<TtsGender, string>>;
  /** Poids d'un caractère dans le quota voix, exprimé en neurones */
  neuronsPerChar: number;
}

/**
 * Voix de chaque langue.
 * - Anglais : Deepgram Aura 1 sur Workers AI (Aura 2 refuse le WAV), facturé 0,015 $ les 1 000 caractères,
 *   1 000 neurones = 0,011 $.
 * - Français : Azure AI Speech, offre gratuite F0 (500 000 caractères par mois, refus au-delà, jamais facturé),
 *   depuis le retrait de MeloTTS (2026-11-20), seule voix française de Workers AI. Un caractère pèse 0,5 neurone :
 *   le plafond global du jour (8 000) reste sous 500 000 / 30 caractères.
 * WAV 24 kHz dans les deux cas, comme attendu par le front.
 */
export const TTS_VOICES: Record<TtsLang, TtsVoice> = {
  en: {
    provider: 'workers-ai',
    model: '@cf/deepgram/aura-1',
    speakers: { atc: { f: 'athena', m: 'helios' }, pilot: { f: 'luna', m: 'orion' } },
    neuronsPerChar: 0.015 / 0.011,
  },
  fr: {
    provider: 'azure',
    model: 'azure-tts',
    speakers: {
      atc: { f: 'fr-FR-DeniseNeural', m: 'fr-FR-HenriNeural' },
      pilot: { f: 'fr-FR-CoralieNeural', m: 'fr-FR-AlainNeural' },
    },
    neuronsPerChar: 0.5,
  },
};

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

/** Demande Azure (SSML) : la voix et sa langue, le texte échappé */
export function azureSsml(text: string, voiceName: string): string {
  const lang = voiceName.slice(0, 5);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voiceName}">${escapeXml(text)}</voice></speak>`;
}

/** Valide la demande de synthèse ; le texte arrive déjà préparé par le front (src/utils/speech.ts) */
export function parseTts(body: unknown): TtsRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const text = str(b.text).replace(/\s+/g, ' ');
  const lang = str(b.lang);
  const speaker = str(b.speaker) || 'atc';
  const gender = str(b.gender) || 'm';
  if (!text || text.length > TTS_MAX_CHARS) return null;
  if (lang !== 'fr' && lang !== 'en') return null;
  if (speaker !== 'atc' && speaker !== 'pilot') return null;
  if (gender !== 'f' && gender !== 'm') return null;
  return { text, lang, speaker, gender };
}

/** Clé de cache stable pour un texte et une langue (SHA-256 hexadécimal) */
/** Nom de la voix d'une demande */
export const voiceName = ({ speaker, gender }: TtsRequest, voice: TtsVoice): string => voice.speakers[speaker][gender];

export async function ttsCacheKey(tts: TtsRequest, voice: TtsVoice): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${tts.lang}\n${voiceName(tts, voice)}\n${tts.text}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // Le modèle fait partie de la clé : changer de voix n'en ressert pas une ancienne
  return `https://tts.phraseo.cache/${voice.model.replace(/[^\w-]/g, '_')}/${hex}`;
}

/** Sortie d'un modèle de synthèse : flux ou octets audio, ou objet { audio } en base64 */
export async function ttsAudioBytes(output: unknown): Promise<Uint8Array> {
  if (output instanceof Uint8Array) return output;
  if (output instanceof ArrayBuffer) return new Uint8Array(output);
  if (output instanceof ReadableStream) return new Uint8Array(await new Response(output).arrayBuffer());
  if (output && typeof (output as { audio?: unknown }).audio === 'string') {
    return Uint8Array.from(atob((output as { audio: string }).audio), (c) => c.charCodeAt(0));
  }
  throw new Error('Sortie de synthèse inattendue');
}

// ── Quotas voix (plan gratuit Workers AI : 10 000 neurones/jour) ─────────────

/** Coût Workers AI par minute d'audio (Whisper turbo, d'après le tarif) */
export const NEURONS_PER_MINUTE = { stt: 45.5 } as const;

export type QuotaScope = 'user' | 'ip' | 'global';
export type QuotaUsage = Record<QuotaScope, number>;
export type QuotaLimits = Record<QuotaScope, number>;

export interface QuotaVerdict {
  allowed: boolean;
  /** Plafond atteint : `global` coupe la voix pour tout le monde */
  scope?: QuotaScope;
  /** Part restante (0–1) pour cet utilisateur : la plus petite des trois */
  left: number;
}

/** Identifiant anonyme d'un navigateur (crypto.randomUUID côté front) */
export const USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Jour de quota : UTC, comme la remise à zéro des neurones Cloudflare */
export const quotaDay = (date = new Date()): string => date.toISOString().slice(0, 10);

/** Le plafond global passe d'abord (coupure pour tous), puis l'IP, puis l'utilisateur */
export function quotaVerdict(usage: QuotaUsage, limits: QuotaLimits): QuotaVerdict {
  const left = Math.max(
    0,
    Math.min(...(['user', 'ip', 'global'] as const).map((s) => (limits[s] - usage[s]) / limits[s]))
  );
  const scope = (['global', 'ip', 'user'] as const).find((s) => usage[s] >= limits[s]);
  return scope ? { allowed: false, scope, left: 0 } : { allowed: true, left };
}

/** Plafonds lus dans wrangler.toml ([vars]) ; valeurs par défaut si absents ou invalides */
export function quotaLimits(vars: { QUOTA_USER?: string; QUOTA_IP?: string; QUOTA_GLOBAL?: string }): QuotaLimits {
  const num = (v: string | undefined, fallback: number) => (Number(v) > 0 ? Number(v) : fallback);
  return { user: num(vars.QUOTA_USER, 800), ip: num(vars.QUOTA_IP, 2400), global: num(vars.QUOTA_GLOBAL, 8000) };
}

/** Durée d'un WAV PCM (MeloTTS renvoie du WAV 44,1 kHz mono) ; null si ce n'est pas un WAV */
export function wavSeconds(bytes: Uint8Array): number | null {
  if (bytes.length < 44 || String.fromCharCode(...bytes.subarray(0, 4)) !== 'RIFF') return null;
  const byteRate = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(28, true);
  return byteRate > 0 ? (bytes.length - 44) / byteRate : null;
}

/** Neurones consommés par une synthèse : tarif au caractère du texte envoyé */
export const ttsNeurons = (text: string, voice: TtsVoice): number => text.length * voice.neuronsPerChar;

// ── Reconnaissance vocale (réponse du pilote, phase 2) ───────────────────────

/** Une réponse radio tient en 15 s ; en dessous de 0,3 s, rien n'a été dit */
export const STT_MAX_SECONDS = 15;
export const STT_MIN_SECONDS = 0.3;
/** WAV 16 kHz mono 16 bits de 15 s ≈ 480 Ko, avec marge */
export const STT_MAX_BYTES = 600_000;

export type SttCheck = { ok: true; seconds: number } | { ok: false; status: number; error: string };

/** Valide l'enregistrement reçu (WAV PCM produit par le site) */
export function checkSttAudio(bytes: Uint8Array): SttCheck {
  if (bytes.length > STT_MAX_BYTES) return { ok: false, status: 413, error: 'Enregistrement trop long' };
  const seconds = wavSeconds(bytes);
  if (seconds === null) return { ok: false, status: 400, error: 'Format audio invalide (WAV attendu)' };
  if (seconds > STT_MAX_SECONDS + 0.5) return { ok: false, status: 413, error: 'Enregistrement trop long' };
  if (seconds < STT_MIN_SECONDS) return { ok: false, status: 400, error: 'Enregistrement trop court' };
  return { ok: true, seconds };
}

/**
 * Contexte fourni à Whisper : mots du vocabulaire envoyés par le site, sans aucun chiffre
 * (sinon le moteur « corrigerait » l'élève vers la valeur attendue) ni caractère inattendu.
 */
export function sttPrompt(lang: 'fr' | 'en', hint: string | null): string {
  const words = (hint ?? '')
    .split(',')
    .map((w) => w.replace(/[^\p{L}' -]/gu, '').trim())
    .filter(Boolean)
    .slice(0, 60);
  const intro = lang === 'fr' ? 'Radiotéléphonie aéronautique.' : 'Aviation radiotelephony.';
  // Mots séparés par des espaces : avec des virgules, Whisper en met entre tous les mots de sa transcription
  return words.length ? `${intro} ${words.join(' ')}`.slice(0, 600) : intro;
}

/** Neurones consommés par une transcription */
export const sttNeurons = (seconds: number): number => (seconds / 60) * NEURONS_PER_MINUTE.stt;
