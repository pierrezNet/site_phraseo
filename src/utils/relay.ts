/**
 * URL du relais (Cloudflare Worker, dossier `worker/`) qui détient les secrets
 * (clé AVWX, webhook Discord). Cette URL est publique : aucun secret côté navigateur.
 */
export const API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? '').replace(/\/+$/, '');
