# Relais Phraséo (Cloudflare Worker)

Le site est statique (GitHub Pages) : tout ce qui est injecté au build via `VITE_*` est lisible dans le JavaScript publié. Les secrets vivent donc ici, côté Worker.

| Route | Rôle |
|---|---|
| `GET /metar/:icao` | METAR depuis aviationweather.gov (NOAA, sans clé), converti au format du front, cache 10 min |
| `POST /feedback` | Valide le retour et le poste sur Discord. Origine autorisée uniquement, 5 envois/min/IP, mentions désactivées |

## Premier déploiement

```bash
cd worker
npm install
npx wrangler login                          # compte Cloudflare
npx wrangler secret put DISCORD_WEBHOOK_URL # coller la NOUVELLE URL du webhook
npm run deploy                              # affiche l'URL https://phraseo-relay.<compte>.workers.dev
```

Puis côté GitHub (Settings → Secrets and variables → Actions) :
- onglet **Variables** : créer `VITE_API_BASE` = l'URL du Worker (sans `/` final) ;
- onglet **Secrets** : supprimer `VITE_AVWX_API_KEY` et `VITE_DISCORD_WEBHOOK_URL`.

## Développement local

```bash
# worker/.dev.vars (ignoré par git)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

npm run dev   # http://localhost:8787
```

Et à la racine du projet, dans `.env.local` : `VITE_API_BASE=http://localhost:8787`.

Les origines autorisées sont dans `wrangler.toml` (`ALLOWED_ORIGINS`). La logique pure (`src/relay.ts`) est testée par le `npm test` de la racine.
