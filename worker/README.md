# Relais Phraséo (Cloudflare Worker)

Le site est statique (GitHub Pages) : tout ce qui est injecté au build via `VITE_*` est lisible dans le JavaScript publié. Les secrets vivent donc ici, côté Worker.

| Route | Rôle |
|---|---|
| `GET /metar/:icao` | METAR depuis aviationweather.gov (NOAA, sans clé), converti au format du front, cache 10 min |
| `POST /feedback` | Valide le retour et le transmet au forum AvroBB (liaison de service `FORUM`, point d'entrée `PhraseoFeedback`) : sujet du forum privé « Retours Phraséo (à trier) », contact envoyé par e-mail aux administrateurs seulement. Origine autorisée uniquement, 5 envois/min/IP |
| `POST /tts` | Voix : `{ text, lang, speaker }` (`speaker` : `atc` ou `pilot` ; texte préparé par `src/utils/speech.ts`, 600 caractères max) → WAV 24 kHz : anglais Deepgram Aura 1 (Workers AI), français Azure AI Speech (offre gratuite F0, MeloTTS ayant été retiré le 2026-11-20). `501` si la voix française n'est pas configurée ou que son offre gratuite est épuisée. Origine autorisée uniquement, 60 synthèses/min/IP, cache 30 jours (une réplique déjà dite ne coûte rien), quotas quotidiens (ci-dessous) |
| `POST /stt?lang=fr` | Réponse du pilote : WAV 16 kHz mono (15 s max), vocabulaire sans nombres dans `X-Stt-Hint` → `{ text }` (Whisper large-v3-turbo). Origine autorisée uniquement, 30 réponses/min/IP, mêmes quotas que la voix |

## Premier déploiement

```bash
cd worker
npm install
npx wrangler login     # compte Cloudflare (le même que le forum AvroBB)
npm run deploy         # affiche l'URL https://phraseo-relay.<compte>.workers.dev
```

Le forum **AvroBB** doit être déployé avant, avec sa migration `0005_phraseo_feedback.sql` (compte système et forum privé « Retours Phraséo (à trier) ») : la liaison `FORUM` vise son point d'entrée `PhraseoFeedback`.

Puis côté GitHub (Settings → Secrets and variables → Actions) :
- onglet **Variables** : créer `VITE_API_BASE` = l'URL du Worker (sans `/` final) ;
- onglet **Secrets** : supprimer `VITE_AVWX_API_KEY` et `VITE_DISCORD_WEBHOOK_URL`.

## Développement local

```bash
npm run dev   # http://localhost:8787 (Workers AI s'exécute à distance : la voix est facturée, même en local)
```

Pour tester « J'ai un retour » en local, lancer aussi le forum sur un autre port (`cd ../avrobb && npm run dev -- --port 8788`, migrations locales appliquées) : `wrangler dev` relie les deux Workers par son registre local.

Et à la racine du projet, dans `.env.local` : `VITE_API_BASE=http://localhost:8787`.

Les origines autorisées sont dans `wrangler.toml` (`ALLOWED_ORIGINS`). La logique pure (`src/relay.ts`) est testée par le `npm test` de la racine.

## Quotas voix

Le plan gratuit de Workers AI donne 10 000 neurones par jour (remise à zéro à 0 h UTC). Le français passe par Azure AI Speech (offre F0 : 500 000 caractères par mois, refus au-delà, jamais facturé) ; un caractère y pèse 0,5 neurone dans le quota, pour que le plafond global reste sous cette offre. Aura 1 est facturé au caractère : 0,015 $ les 1 000, soit environ 1,36 neurone par caractère (≈ 140 pour une réplique de 100 caractères ; MeloTTS coûtait environ 2 neurones par réplique). Whisper turbo coûte environ 45,5 neurones par minute d'audio.

Le Durable Object `VoiceQuota` (SQLite, une instance unique) compte l'usage du jour en neurones estimés (synthèse : nombre de caractères ; reconnaissance : durée de l'audio) :

| Variable (`wrangler.toml`) | Défaut | Rôle |
|---|---|---|
| `QUOTA_USER` | 800 | Par navigateur (identifiant anonyme `X-Phraseo-User`), soit environ 6 répliques synthétisées (les répliques déjà en cache sont gratuites) |
| `QUOTA_IP` | 2400 | Par IP : garde-fou si l'identifiant est effacé, tout en laissant passer un club derrière une seule connexion |
| `QUOTA_GLOBAL` | 8000 | Total de l'application (réserve de 20 % sur les 10 000) : au-delà, la voix est coupée pour tout le monde |

- Au-delà d'un plafond : `429 { "quota": "user" | "ip" | "global" }`. Le site affiche un message, et les textes restent disponibles.
- Après chaque synthèse facturée, l'en-tête `X-Voice-Quota-Left` (0 à 1) donne la part restante. Elle est affichée au survol du bouton 🔊 de la barre.
- Une réplique servie depuis le cache ne compte pas.

Pour tester le blocage en local, ajoutez `QUOTA_USER = "1"` dans `worker/.dev.vars`, puis `npm run dev`.

## Voix française (Azure AI Speech)

1. Portail Azure : créer une ressource **Speech** (ou « Azure AI services – Speech »), niveau tarifaire **Free F0**, région au choix (`francecentral` par défaut dans `wrangler.toml`).
2. Reporter la région dans `AZURE_SPEECH_REGION` (`wrangler.toml`) si elle diffère.
3. Enregistrer une des deux clés de la ressource : `npx wrangler secret put AZURE_SPEECH_KEY`.

Sans clé, le relais répond `501` en français et le site masque l'écoute française. Voix : `fr-FR-HenriNeural` (ATC), `fr-FR-AlainNeural` (pilote), dans `TTS_VOICES` (`src/relay.ts`).
