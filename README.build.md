# Phraséo – Phraseologie aéronautique

Ce dépôt contient la version **statique buildée** du site *Phraséo*, dédiée à la phraseologie aéronautique (FR/EN).

Le site est généré en amont (build) puis déployé tel quel sur GitHub Pages. Seul un petit relais (Cloudflare Worker, dossier `worker/`) détient les secrets : METAR et retours Discord.

🌍 Site en ligne :  
https://phraseo.aeronautique.xyz/

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

## Licence
Creative Commons Attribution 4.0 International (CC BY 4.0)