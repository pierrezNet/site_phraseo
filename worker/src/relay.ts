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
  const mode = str(b.mode);
  const level = str(b.level);
  const lang = str(b.lang);

  if (!(FEEDBACK_TYPES as readonly string[]).includes(type)) return null;
  if (!message || message.length > 1800) return null;
  if (contact.length > 120 || level.length > 20) return null;
  if (!['VFR', 'IFR', ''].includes(mode) || !['fr', 'en', ''].includes(lang)) return null;

  return { type: type as Feedback['type'], message, contact, mode: mode as Feedback['mode'], level, lang: lang as Feedback['lang'] };
}

/** Message Discord construit côté relais : les mentions (@everyone, rôles…) sont désactivées */
export function discordPayload(f: Feedback) {
  return {
    username: 'Phraséo — Feedback',
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: `Nouveau retour — ${f.type}`,
        description: f.message,
        color: 0x1e40af,
        fields: [
          { name: 'Mode', value: f.mode || '—', inline: true },
          { name: 'Niveau', value: f.level || '—', inline: true },
          { name: 'Langue', value: f.lang || '—', inline: true },
          { name: 'Contact', value: f.contact || '—', inline: false },
        ],
      },
    ],
  };
}

// ── Synthèse vocale (voix de l'ATC) ──────────────────────────────────────────

export const TTS_MAX_CHARS = 600;

export interface TtsRequest {
  text: string;
  lang: 'fr' | 'en';
}

/** Valide la demande de synthèse ; le texte arrive déjà préparé par le front (src/utils/speech.ts) */
export function parseTts(body: unknown): TtsRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const text = str(b.text).replace(/\s+/g, ' ');
  const lang = str(b.lang);
  if (!text || text.length > TTS_MAX_CHARS) return null;
  if (lang !== 'fr' && lang !== 'en') return null;
  return { text, lang };
}

/** Clé de cache stable pour un texte et une langue (SHA-256 hexadécimal) */
export async function ttsCacheKey({ text, lang }: TtsRequest): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${lang}\n${text}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `https://tts.phraseo.cache/melotts/${hex}`;
}

/** Sortie MeloTTS : octets MP3, ou objet { audio } en base64 selon la version de l'API */
export function ttsAudioBytes(output: Uint8Array | { audio: string }): Uint8Array {
  if (output instanceof Uint8Array) return output;
  return Uint8Array.from(atob(output.audio), (c) => c.charCodeAt(0));
}

// ── Quotas voix (plan gratuit Workers AI : 10 000 neurones/jour) ─────────────

/** Coût Workers AI par minute d'audio (MeloTTS mesuré ; Whisper turbo d'après le tarif) */
export const NEURONS_PER_MINUTE = { tts: 18.6, stt: 45.5 } as const;

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

/** Neurones consommés par une synthèse : durée réelle, sinon estimée (≈ 12 caractères par seconde) */
export function ttsNeurons(audio: Uint8Array, text: string): number {
  const seconds = wavSeconds(audio) ?? text.length / 12;
  return (seconds / 60) * NEURONS_PER_MINUTE.tts;
}
