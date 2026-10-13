# Banc vocal (phase 0)

Comparer des moteurs de reconnaissance vocale sur de **vraies** phrases de pilote, avec la notation du quiz (éléments critiques exigés, score ≥ 75 %). Rien ici n'est publié avec le site.

## 1. Enregistrer (≈ 15 min)

1. `npm run dev`, puis ouvrir **http://localhost:5173/bench/voice/recorder.html** dans **Chrome, Chromium ou Edge** (écriture dans un dossier local).
2. « Choisir le dossier d'enregistrement » → `bench/voice/recordings` (à créer ; ignoré par git).
   **Chromium installé en snap** ne peut écrire que dans votre dossier personnel : choisissez alors par exemple `~/Documents/phraseo-voix`, et lancez le banc avec `BENCH_RECORDINGS=~/Documents/phraseo-voix npm run bench:voice`. La page vérifie le droit d'écriture dès le choix du dossier.
3. Pour chaque phrase : maintenir le bouton (ou la barre d'espace), parler comme à la radio, relâcher. ← / → pour naviguer, « Réécouter » pour vérifier.

Les 50 phrases (35 FR, 15 EN) sont tirées des scénarios du vol complet avec **vos paramètres** (indicatif, aérodromes, fréquences). On peut fermer et reprendre : les prises du dossier sont rechargées.

Chaque prise est enregistrée en WAV 16 kHz mono, avec `manifest.json` (phrase attendue, éléments critiques, équivalences d'indicatif).

## 2. Configurer les moteurs

Copier `.env.bench.example` en `.env.bench` (ignoré par git) et renseigner les clés des moteurs à tester. Un moteur sans clé est ignoré.

| Moteur | Où obtenir l'accès |
|---|---|
| Azure AI Speech | Portail Azure → créer une ressource « Speech », région **France Central** → clés |
| Mistral Voxtral | console.mistral.ai → API keys |
| Whisper (Cloudflare Workers AI) | Tableau de bord Cloudflare → identifiant de compte ; jeton API « Workers AI » |

## 3. Lancer

```bash
npm run bench:voice                    # tous les moteurs configurés
npm run bench:voice -- azure mistral   # seulement ceux-là
```

Le rapport (`bench/voice/results/rapport-….md`) donne par moteur et par langue : éléments critiques justes, phrases validées, score moyen, taux d'erreur sur les mots (WER), latence et coût du banc ; puis chaque élément critique manqué avec ce que le moteur a entendu. Les transcriptions brutes sont dans `trials-….json`.

Autre voix ou autre dossier : `BENCH_RECORDINGS=chemin npm run bench:voice`.

## Notes

- Le moteur **reference** renvoie la phrase attendue : il doit obtenir 100 % (contrôle de la chaîne).
- Le vocabulaire fourni aux moteurs (alphabet OACI, stations, noms propres des phrases) ne contient **jamais de nombres** : sinon le moteur « corrigerait » les erreurs vers la bonne valeur.
- Les formats d'API (Azure fast transcription, Mistral `audio/transcriptions`, Workers AI Whisper) sont ceux documentés à la date du banc ; une erreur HTTP est rapportée telle quelle.
