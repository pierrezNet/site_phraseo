# Relais Phraséo (Cloudflare Worker)

Le site est statique (GitHub Pages) : tout ce qui est injecté au build via `VITE_*` est lisible dans le JavaScript publié. Les secrets vivent donc ici, côté Worker.

| Route | Rôle |
|---|---|
| `GET /metar/:icao` | METAR depuis aviationweather.gov (NOAA, sans clé), converti au format du front, cache 10 min |
| `POST /feedback` | Valide le retour et le poste sur Discord. Origine autorisée uniquement, 5 envois/min/IP, mentions désactivées |
| `POST /tts` | Voix : `{ text, lang }` (texte préparé par `src/utils/speech.ts`, 600 caractères max) → WAV MeloTTS (Workers AI). Origine autorisée uniquement, 60 synthèses/min/IP, cache 30 jours (une réplique déjà dite ne coûte rien), quotas quotidiens (ci-dessous) |
| `POST /stt?lang=fr` | Réponse du pilote : WAV 16 kHz mono (15 s max), vocabulaire sans nombres dans `X-Stt-Hint` → `{ text }` (Whisper large-v3-turbo). Origine autorisée uniquement, 30 réponses/min/IP, mêmes quotas que la voix |

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

npm run dev   # http://localhost:8787 (Workers AI s'exécute à distance : la voix est facturée, même en local)
```

Et à la racine du projet, dans `.env.local` : `VITE_API_BASE=http://localhost:8787`.

Les origines autorisées sont dans `wrangler.toml` (`ALLOWED_ORIGINS`). La logique pure (`src/relay.ts`) est testée par le `npm test` de la racine.

## Quotas voix

Le plan gratuit de Workers AI donne 10 000 neurones par jour (remise à zéro à 0 h UTC). MeloTTS coûte environ 18,6 neurones par minute d'audio, Whisper turbo environ 45,5.

Le Durable Object `VoiceQuota` (SQLite, une instance unique) compte l'usage du jour en neurones estimés d'après la durée de l'audio :

| Variable (`wrangler.toml`) | Défaut | Rôle |
|---|---|---|
| `QUOTA_USER` | 800 | Par navigateur (identifiant anonyme `X-Phraseo-User`), soit environ 5 vols complets en voix |
| `QUOTA_IP` | 2400 | Par IP : garde-fou si l'identifiant est effacé, tout en laissant passer un club derrière une seule connexion |
| `QUOTA_GLOBAL` | 8000 | Total de l'application (réserve de 20 % sur les 10 000) : au-delà, la voix est coupée pour tout le monde |

- Au-delà d'un plafond : `429 { "quota": "user" | "ip" | "global" }`. Le site affiche un message, et les textes restent disponibles.
- Après chaque synthèse facturée, l'en-tête `X-Voice-Quota-Left` (0 à 1) donne la part restante. Elle est affichée au survol du bouton 🔊 de la barre.
- Une réplique servie depuis le cache ne compte pas.

Pour tester le blocage en local, ajoutez `QUOTA_USER = "1"` dans `worker/.dev.vars`, puis `npm run dev`.
