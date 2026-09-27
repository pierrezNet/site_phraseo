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
