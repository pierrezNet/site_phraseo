/**
 * Relais Phraséo (Cloudflare Worker)
 *
 *   GET  /metar/:icao  → METAR NOAA (sans clé), mis en cache 10 min
 *   POST /feedback     → message Discord (webhook stocké en secret)
 *
 * Le site statique (GitHub Pages) n'embarque ainsi plus aucun secret.
 */
import { ICAO_RE, discordPayload, parseFeedback, toMetar, type NoaaMetar } from './relay';

interface Env {
  DISCORD_WEBHOOK_URL: string;
  /** Origines autorisées, séparées par des virgules */
  ALLOWED_ORIGINS: string;
  FEEDBACK_LIMITER: RateLimit;
}

const METAR_TTL_S = 600;
const MAX_BODY_BYTES = 4096;

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const json = (data: unknown, status: number, headers: Record<string, string>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers, ...extra },
  });

async function handleMetar(icao: string, cors: Record<string, string>): Promise<Response> {
  if (!ICAO_RE.test(icao)) return json({ error: 'Code OACI invalide' }, 400, cors);

  const upstream = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, {
    cf: { cacheTtl: METAR_TTL_S, cacheEverything: true },
  });
  if (!upstream.ok) return json({ error: 'METAR indisponible' }, 502, cors);

  // La NOAA renvoie 204 (corps vide) pour une station inconnue
  const text = await upstream.text();
  const list = text ? (JSON.parse(text) as NoaaMetar[]) : [];
  if (!list.length) return json({ error: 'Aucun METAR pour cette station' }, 404, cors);

  return json(toMetar(list[0]), 200, cors, { 'Cache-Control': `public, max-age=${METAR_TTL_S}` });
}

async function handleFeedback(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  // Pas d'en-tête CORS = origine non autorisée : on refuse aussi côté serveur
  if (!cors['Access-Control-Allow-Origin']) return json({ error: 'Origine non autorisée' }, 403, cors);

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const { success } = await env.FEEDBACK_LIMITER.limit({ key: ip });
  if (!success) return json({ error: 'Trop de requêtes, réessaie dans une minute' }, 429, cors);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Message trop long' }, 413, cors);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'JSON invalide' }, 400, cors);
  }

  const feedback = parseFeedback(body);
  if (!feedback) return json({ error: 'Champs invalides' }, 400, cors);

  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordPayload(feedback)),
  });
  if (!res.ok) {
    console.error('Discord a répondu', res.status);
    return json({ error: 'Envoi impossible' }, 502, cors);
  }

  return new Response(null, { status: 204, headers: cors });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'), env);
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    // Racine : simple description, utile pour vérifier que le relais répond
    if (pathname === '/' && request.method === 'GET') {
      return json({ service: 'phraseo-relay', routes: ['GET /metar/:icao', 'POST /feedback'] }, 200, cors);
    }

    const metar = pathname.match(/^\/metar\/([^/]+)$/);
    if (metar && request.method === 'GET') return handleMetar(metar[1].toUpperCase(), cors);

    if (pathname === '/feedback' && request.method === 'POST') return handleFeedback(request, env, cors);

    return json({ error: 'Not found' }, 404, cors);
  },
} satisfies ExportedHandler<Env>;
