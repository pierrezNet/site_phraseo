# Phraséo – Phraseologie aéronautique

Ce dépôt contient la version **statique buildée** du site *Phraséo*, dédiée à la phraseologie aéronautique (FR/EN).

Le site est généré en amont (build) puis déployé tel quel sur GitHub Pages. Seul un petit relais (Cloudflare Worker, dossier `worker/`) sert ce qui demande un serveur : METAR, voix de l'ATC et reconnaissance vocale, retours « J'ai un retour » (transmis au forum AvroBB).

🌍 **En ligne : [phraseo.aeronautique.xyz](https://phraseo.aeronautique.xyz/)** · 💬 Retours et échanges : [forum de la phraséologie](https://avrobb.org/forum/4-phraseologie-aeronautique)

## Stack
- HTML statique
- JavaScript
- Tailwind CSS
- Build via Vite

## Philosophie
- Site 100 % statique, aucun secret dans le bundle
- Un relais minimal pour les seuls appels qui en ont besoin
- Performance maximale
- Hébergement simple et robuste

## Soutenir le projet
L'application est gratuite. Les dons, reçus par le collectif [opencollective.com/phraseo](https://opencollective.com/phraseo) (hôte fiscal : Open Source Europe), couvrent uniquement les frais de fonctionnement, sur factures publiques : voix de synthèse (Microsoft Azure, Cloudflare Workers AI) et hébergement.

## Licence
Double licence, détaillée dans [LICENSE](LICENSE) :
- **code** (application, relais `worker/`, banc `bench/`) : [MIT](https://opensource.org/license/mit) ;
- **textes et données de phraséologie** (`src/data/`, aide et à propos, `docs/`) : [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).