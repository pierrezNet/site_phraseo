# Prononciation de la voix (ATC et pilote)

Référence des règles appliquées par la synthèse vocale, avec leur source et des exemples.

- **Où c'est codé** : [`src/utils/speech.ts`](../src/utils/speech.ts) (texte → parole), testé dans [`speech.test.ts`](../src/utils/speech.test.ts). Chaque règle ci-dessous y a un test.
- **Moteur** : MeloTTS (Cloudflare Workers AI) via le relais `POST /tts`. Une seule voix par langue, sans réglage de style : on ne contrôle que le texte envoyé et la façon de le jouer.
- **Sources** : manuel DGAC de phraséologie, 10ᵉ édition (`Manuel_Phraseologie.pdf`, abrégé « DGAC ») ; wiki IVAO France (« IVAO ») ; écoute par Emmanuel (« oreille ») ; aller-retour MeloTTS → Whisper (« aller-retour », voir en fin de page).

## Nombres

| Règle | FR | EN | Source |
|---|---|---|---|
| Cas général | Langage courant : « transpondeur 7001 » → *sept mille un*, « niveau 110 » → *cent dix*, QNH 1013 → *mille treize* | Chiffre par chiffre : *seven zero zero one*, *one one zero*, *one zero one tree* | DGAC p. 17 (FR : courant ou chiffres) ; oreille (FR : le découpage n'est pas nécessaire) |
| Centaines et milliers ronds | *deux mille cinq cents* | *two thousand fife hundred*, *one zero thousand* | DGAC (EN) |
| Écrit avec underscores (`1_1_0`, `6_0`) | Nombre entier : *cent dix*, *soixante* | Chiffre par chiffre | Convention des JSON |
| Zéro initial (`04`, `0_25`) | Chiffre par chiffre : *zéro quatre* ; `0_25` → *zéro vingt-cinq* | Chiffre par chiffre | DGAC |
| Cap | Toujours trois chiffres, un par un : *cap deux sept zéro*, « cap 60 » → *zéro six zéro* | *heading zero six zero* | DGAC p. 17 |
| Chiffre 1 seul dans un identifiant (W41 n'est pas concerné, ODILO 1A) | *unité* : *Odilo unité Alfa* | *one* | IVAO |
| « 1 » en langage courant | *un*, *une* devant minute, heure, seconde : *éloignement une minute*, *numéro un* | — | Grammaire |
| Fréquence | *cent dix-huit décimale sept* ; `119.700` → *cent dix-neuf décimale sept* (jamais « sept cents ») ; 121.075 → *décimale zéro soixante-quinze* | *one one eight decimal seven* | DGAC p. 17 ; oreille |
| Prononciation OACI | — | *tree*, *fife*, *niner* | IVAO / OACI |
| Position horaire d'un trafic | *onze heures* | *eleven o'clock* | Usage |
| Demi-tour, tour complet | *un trois cent soixante* | *a three-sixty*, *a one-eighty* | Usage |
| Température négative | *moins cinq* | *minus fife* | — |
| Numéro de vol d'une compagnie | Par groupes de deux chiffres en partant de la droite : *Air Europe zéro douze*, *Air France douze trente-quatre* | Tous les chiffres séparés : *one two tree four* | Oreille ; règle anglaise |

Le groupement du numéro de vol touche seulement la voix française, pas l'affichage. Il est appliqué à l'indicatif saisi (`groupFlightNumber`). Dans les JSON, on l'écrit directement : `(Air France 12_34)`.

## Lettres et sigles

| Règle | FR | EN | Source |
|---|---|---|---|
| Lettres isolées (indicatif abrégé, taxiway, immatriculation) | Alphabet OACI : « F S T » → *Fox trotte Sierra Tango*, « W 7 » → *Ouisski sept*, « F-EPST » épelé | *Foxtrot Sierra Tango* | OACI |
| Sigle à underscores (`Q_N_H`, `I_L_S`, `C_T_O_T`) | Lettres écrites comme des mots français : *cu haine hache*, *i elle esse*, *cé té o té* | Lettres : *Q N H* | Aller-retour : « ku ène ache » était compris « Queen H » |
| Sigles prononcés comme un mot | `A_TIS`, `C_TOT` (EN) : la partie en un bloc est lue comme un mot | Idem | DGAC p. 10 (énonciation des sigles usuels) |
| CTOT | `C_T_O_T` | `C_TOT` | DGAC p. 10 (les deux formes sont admises) ; oreille (FR épelé) |
| Point de report, procédure (BASIP, `Bubli_3_Papa`) | Lu comme un mot, pas épelé : *Basip*, *Bubli trois Papa* | Idem | Oreille |
| Route ATS | `(Upper N 871)` → *Upper November huit cent soixante et onze* | *Upper November eight seven one* | DGAC (« Upper B 25 ») |
| Types Airbus | `A320` → *Airbus trois cent vingt* (pas « Alfa ») | *Airbus tree two zero* | Oreille |

### Mots réécrits pour la voix française

MeloTTS prononce mal certains mots anglais. Ils sont réécrits uniquement dans le texte envoyé à la voix :

| Mot | Envoyé comme | Source |
|---|---|---|
| Whiskey / Whisky | Ouisski | Oreille, aller-retour |
| Boeing | Boïngue | Oreille |
| Foxtrot | Fox trotte | Oreille ; aller-retour (« Foxtrotte » → « Fextrot ») |

Pour en ajouter un : dictionnaire `FR_PRONUNCIATION` de `speech.ts`, plus un test.

## Ce qui n'est pas dit

- Les notes `{…}` (consignes et infobulles) ne sont pas dites.
- Le HTML est retiré.
- Les parenthèses sont retirées, mais leur contenu est dit : `(Airbus 320)` → *Airbus trois cent vingt*.

## Conventions d'écriture des JSON qui influencent la voix

- `_` : à dire chiffre par chiffre ou lettre par lettre (en FR, un nombre écrit `1_1_0` reste dit *cent dix*).
- `( )` : mots hors phraséologie mais indispensables, facultatifs au quiz : types des autres avions `(Cessna 172)`, `(T_B 9)`, indicatif d'un autre vol `(Air France 12_34)`.
- Le type de son propre avion vient de `[COM]`, sans parenthèses.
- Piste opposée (contre-QFU) : tag `[RWYO]`.

## Rendu à la lecture

Réglages dans `VOICES` ([`src/utils/atcAudio.ts`](../src/utils/atcAudio.ts)) :

| | ATC | Pilote |
|---|---|---|
| Débit FR / EN | 1,1× / 0,88×, hauteur conservée | 0,92× / 0,86×, hauteur non conservée (donc plus grave) |
| Radio | Bande 300–3400 Hz, compression | Bande 450–2800 Hz, légère saturation (radio de bord) |

## Tester une graphie sans l'écouter : l'aller-retour

Faire dire la graphie par MeloTTS, puis transcrire l'audio avec Whisper (les deux sur Workers AI, avec les clés de `bench/voice/.env.bench`). Si Whisper retrouve le sigle ou le mot, la graphie est bonne. Whisper reste un juge imparfait : tester chaque variante dans deux phrases différentes. Par exemple, « approche i elle esse piste » est mal découpé par Whisper, alors qu'une oreille humaine comprend.
