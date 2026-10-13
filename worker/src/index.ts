/**
 * Relais Phraséo (Cloudflare Worker)
 *
 *   GET  /metar/:icao  → METAR NOAA (sans clé), mis en cache 10 min
 *   POST /feedback     → message Discord (webhook stocké en secret)
 *   POST /tts          → voix de l'ATC (MeloTTS, Workers AI), WAV mis en cache 30 jours,
 *                        quotas du jour par utilisateur anonyme, par IP et au total (Durable Object VoiceQuota)
 *
 * Le site statique (GitHub Pages) n'embarque ainsi plus aucun secret.
 */
import {
  ICAO_RE,
  USER_ID_RE,
  discordPayload,
  parseFeedback,
  parseTts,
  quotaLimits,
  toMetar,
  ttsAudioBytes,
  ttsCacheKey,
  ttsNeurons,
  type NoaaMetar,
} from './relay';
import type { VoiceQuota } from './quota';

export { VoiceQuota } from './quota';

interface Env {
  DISCORD_WEBHOOK_URL: string;
  /** Origines autorisées, séparées par des virgules */
  ALLOWED_ORIGINS: string;
  FEEDBACK_LIMITER: RateLimit;
  TTS_LIMITER: RateLimit;
  AI: Ai;
  QUOTA: DurableObjectNamespace<VoiceQuota>;
  /** Plafonds quotidiens en neurones (wrangler.toml) */
  QUOTA_USER?: string;
  QUOTA_IP?: string;
  QUOTA_GLOBAL?: string;
}

const METAR_TTL_S = 600;
const MAX_BODY_BYTES = 4096;
const TTS_TTL_S = 30 * 24 * 3600;

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Phraseo-User',
    'Access-Control-Expose-Headers': 'X-Voice-Quota-Left',
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

async function handleTts(request: Request, env: Env, ctx: ExecutionContext, cors: Record<string, string>): Promise<Response> {
  if (!cors['Access-Control-Allow-Origin']) return json({ error: 'Origine non autorisée' }, 403, cors);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Texte trop long' }, 413, cors);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'JSON invalide' }, 400, cors);
  }
  const tts = parseTts(body);
  if (!tts) return json({ error: 'Champs invalides' }, 400, cors);

  // Même réplique avec les mêmes paramètres : servie depuis le cache, sans compter dans la limite ni le quota
  const cache = caches.default;
  const key = new Request(await ttsCacheKey(tts));
  const cached = await cache.match(key);
  if (cached) return new Response(cached.body, { headers: { ...Object.fromEntries(cached.headers), ...cors } });

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const { success } = await env.TTS_LIMITER.limit({ key: ip });
  if (!success) return json({ error: 'Trop de requêtes, réessaie dans une minute' }, 429, cors);

  // Quotas du jour : sans identifiant valide, l'IP tient lieu d'utilisateur
  const header = request.headers.get('X-Phraseo-User') ?? '';
  const user = USER_ID_RE.test(header) ? header.toLowerCase() : `ip:${ip}`;
  const limits = quotaLimits(env);
  const quota = env.QUOTA.get(env.QUOTA.idFromName('global'));
  const verdict = await quota.check(user, ip, limits);
  if (!verdict.allowed) return json({ error: 'Quota voix atteint', quota: verdict.scope }, 429, cors, { 'X-Voice-Quota-Left': '0' });

  let audio: Uint8Array;
  try {
    audio = ttsAudioBytes(await env.AI.run('@cf/myshell-ai/melotts', { prompt: tts.text, lang: tts.lang }));
  } catch (err) {
    console.error('MeloTTS a échoué', err);
    return json({ error: 'Synthèse indisponible' }, 502, cors);
  }

  const { left } = await quota.charge(user, ip, ttsNeurons(audio, tts.text), limits);

  // MeloTTS renvoie du WAV (PCM 44,1 kHz mono)
  const headers = { 'Content-Type': 'audio/wav', 'Cache-Control': `public, max-age=${TTS_TTL_S}` };
  ctx.waitUntil(cache.put(key, new Response(audio, { headers })));
  return new Response(audio, { headers: { ...headers, ...cors, 'X-Voice-Quota-Left': left.toFixed(3) } });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'), env);
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    // Racine : simple description, utile pour vérifier que le relais répond
    if (pathname === '/' && request.method === 'GET') {
      return json({ service: 'phraseo-relay', routes: ['GET /metar/:icao', 'POST /feedback', 'POST /tts'] }, 200, cors);
    }

    const metar = pathname.match(/^\/metar\/([^/]+)$/);
    if (metar && request.method === 'GET') return handleMetar(metar[1].toUpperCase(), cors);

    if (pathname === '/feedback' && request.method === 'POST') return handleFeedback(request, env, cors);

    if (pathname === '/tts' && request.method === 'POST') return handleTts(request, env, ctx, cors);

    return json({ error: 'Not found' }, 404, cors);
  },
} satisfies ExportedHandler<Env>;
