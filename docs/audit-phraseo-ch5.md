# Audit phraséologie — Manuel DGAC 10e éd. (ch.5) vs données JSON

_Généré par audit multi-agents (21 agents, vérification adversariale). 40 erreurs, 50 manquements, 49 propositions Avancé confirmées._

> Les numéros de ligne cités par les agents sont indicatifs (localiser par le texte lors de la correction).

## Synthèse

### Patterns récurrents (à corriger globalement)

**1. Le pilote collationne des expressions RESERVEES ATC (autorise/cleared) au lieu du verbe d'action**  
_Sections :_ Circuit VFR (CIRCUIT-E1/E2), Atterrissage (ATT-E1/E2), Circulation sol (SOL-E1)  
_Correction :_ Regle ed.10 (verbe d'action). Reecrire tous les collationnements pilote fautifs: VFR.json l.700 'Cleared to touch and go' -> 'Touch and go runway [RWY]'; l.746 'autorisé option' -> 'Option piste [RWY]'; l.756 'cleared option' -> 'Option runway [RWY]'; IFR.json l.408 EN 'Push-back approved' readback -> 'Pushing back'; l.460 'Maintaining short of runway' -> 'Holding short of holding point runway [RWY] [HLD]'. Note: le FR de TOUCHER l.690 est aussi fautif ('Autorisé toucher'). Le pilote annonce l'action, jamais la clairance.

**2. Terme obsolete 'verticale terrain' / 'over airfield' au lieu de 'verticale aerodrome' (ed.10 remplace terrain->aerodrome)**  
_Sections :_ Decollage VFR (DECO-E1), Circuit VFR (CIRCUIT-E4), Transit VFR (TRANSIT-E1, TRANSITVERT-E1)  
_Correction :_ VFR.json l.431/436 'verticale terrain' -> 'verticale aérodrome'; l.1130/1135/1163 'verticale terrain' -> 'verticale aérodrome'; aligner l'EN l.441/446/1145/1150/1178/1183/1188 'over airfield' -> 'over aerodrome' (ou 'overhead airfield' selon manuel). Incoherence FR/EN a corriger simultanement. Renommer aussi la tache 'Verticale terrain' en 'Verticale aérodrome'.

**3. Incoherence libelle FR conforme mais EN fautif au sein d'une meme tache (traduction perdue, faute d'anglais, ou francais colle dans champ EN)**  
_Sections :_ Croisiere (CROISIERE-E3/E4/E5), Approche (APP-E1/E2/E4), Atterrissage (ATT-E3/E5), Circulation sol (SOL-E1/E2/E4)  
_Correction :_ IFR.json l.1074 'Route amendement' -> 'Route amendment'; l.1097 'approuved' -> 'approved'; l.3175 'maintening' -> 'maintaining' + ajouter 'runway [RWY]'; l.1929 'report runway vacating' -> 'report runway vacated'; l.2031/2041 'au parking, pour quitter' (francais dans champ EN) -> 'at the apron, leaving the frequency'. Verifier systematiquement la parite FR/EN de chaque paire.

**4. Clairance/collationnement IFR: 'montee initiale [NIV]' employe au lieu de 'niveau [NIV]' dans la clairance initiale SID**  
_Sections :_ Prevol (PREVOL-E1) — affecte MER_APPROUVEE, EST_IL_RNAV, NON_RNAV, MER_OMNI  
_Correction :_ IFR.json l.267/282/295/305/310/375/380/390/395/2535/2540/2550/2555: remplacer 'montée initiale [NIV]'/'initial climb [NIV]' par 'niveau [NIV]'/'level [NIV]' dans la clairance initiale (l'exemple SID du manuel dit 'niveau 110'). 'Montee initiale' n'appartient qu'au chapitre depart/montee, pas a la clairance Prevol. Aligner ATC et collationnement pilote.

**5. Formulations ATC non normalisees ed.10 (say if/say speed/stop climbing/gate vs stand)**  
_Sections :_ Decollage (DECO-E3/E4), Descente (DESC-E2), Departs&Montee (DE-E1), Prevol (PREVOL-E4)  
_Correction :_ EN ATC: 'say if ready' -> 'are you ready for immediate departure?'; 'say speed?' -> 'report speed'; 'stop climbing level' -> 'stop climb level'; 'and cleared for immediate take-off' -> retirer 'and'; 'gate [POS], request startup to [ARR]' -> 'stand [POS], request start-up destination [ARR]' (l.2577). Uniformiser 'start-up' avec trait d'union et 'pushback' en un mot (l.469 'Boeing 7 3 7' -> 'Boeing 737', non epele).

### Top priorités
- [CIRCUIT-E1/E2 + ATT-E1/E2] CRITIQUE/MAJEUR — Supprimer les collationnements pilote de clairances reservees (toucher/option) dans VFR.json l.690/700/746/756. Faute de securite pedagogique la plus visible car COMPLET applique deja la bonne regle a cote.
- [SOL-E1/E2] MAJEUR — Corriger les readbacks pilote EN IFR.json l.408 ('Push-back approved' -> 'Pushing back') et l.460 ('Maintaining short of runway' -> 'Holding short of holding point runway [RWY] [HLD]'). Meme regle verbe d'action, cote IFR.
- [PREVOL-E1] MAJEUR — Remplacer 'montee initiale [NIV]' par 'niveau [NIV]' dans les 4 taches de clairance initiale SID (13 occurrences). Erreur de libelle de reference confirmee contre l'exemple du manuel.
- [CIRCUIT-E4 + DECO-E1 + TRANSIT-E1/E2] MAJEUR/mineur — Remplacer 'verticale terrain'/'over airfield' par 'verticale aerodrome'/'over aerodrome' partout (VFR.json l.431/436/1130/1135/1163 + EN associes). Terme obsolete recurrent, corriger en un lot.
- [SOL-E3] MAJEUR — IFR.json: 'maintenez avant piste [RWY] taxiway [HLD]' -> 'maintenez avant point d'attente piste [RWY] [HLD]'. Retablir 'point d'attente' et respecter l'usage reserve du mot 'piste'.
- [CROISIERE-E1] MAJEUR — Collationnement info-trafic 'Roger' -> 'Je surveille'/'Looking out' (forme de base ed.10) ET remplir la parenthese vide '(des acquisition visuelle)' actuellement '()' dans IFR.json. Harmoniser avec E2 cote VFR.
- [DESC-E1 + DESC-E4] MAJEUR — IFR.json l.569: retirer 'le'/'au' ('libere niveau [NIVQUITTE] en descente niveau [NIV]') et remplacer le placeholder brut 'XXX' par une balise; l.627: dissocier niveau de vol et altitude+QNH (ne pas coupler [NIV] + 'pieds' + QNH).
- [DESC-E2 + DESC-E5] mineur mais frequent — 'quelle est votre vitesse'/'say speed' -> 'indiquez votre vitesse'/'report speed'; 'HAP 32' -> 'H_A_P 32' et EN 'estimated approach time' -> 'expected approach time'. Normalisation ed.10 sur des expressions tres courantes.

### Quick wins (1 ligne)
- IFR.json l.1074: 'Route amendement' -> 'Route amendment' (faute orthographe EN, CROISIERE-E3)
- IFR.json l.1097: 'direct [WPT] approuved' -> 'direct [WPT] approved' (faute orthographe EN, CROISIERE-E4)
- IFR.json l.3175: 'maintening' -> 'maintaining' et ajouter 'runway [RWY]' apres 'vectoring I_L_S runway' (APP-E1)
- IFR.json l.1929: 'report runway vacating' -> 'report runway vacated' (participe passe, ATT-E3; la tache VFR homonyme l.176 est deja correcte)
- IFR.json l.2031 et l.2041: '[DEP] [NGND], [CAL], au parking, pour quitter' (francais colle dans champ EN) -> 'at the apron, leaving the frequency' (ATT-E5)
- IFR.json l.469: 'Boeing 7 3 7' -> 'Boeing 737' (type non epele, coherence avec le FR l.405 et le manuel, SOL-E4)
- IFR.json: corriger l'espace manquant '[CAL],route' -> '[CAL], route' dans le refus de changement de route (formatage, CROISIERE-E5)
- IFR.json l.535-536: ordre des mots du refus EN 'route amendment unable due flow control' -> 'unable new route due flow control' (CROISIERE-E5)
- IFR.json: remplir la parenthese vide '()' du collationnement info-trafic '(des acquisition visuelle)' actuellement sans texte (CROISIERE-E1)
- IFR.json: 'HAP 32' -> 'H_A_P 32' (epellation phonetique coherente avec Q_N_H/R_N_P) et EN 'estimated approach time' -> 'expected approach time' (DESC-E5)
- Uniformiser 'startup'/'push-back' -> 'start-up' (trait d'union) et 'pushback' (un mot) selon le manuel, dans les taches Prevol/Sol IFR (PREVOL-E4, SOL-E4)
- Renommer l'id de tache 'MONTEE_DIFFEREE' -> 'STOP_CLIMB' (le contenu 'Stoppez la montee' est correct, seul l'id induit en erreur, DE-E2)

### Plan niveau Avancé
- **[Prevol IFR · IFR]** Clairance initiale DMAN avec T_SAT/T_O_B_T (PREVOL-A1), mise a jour T_O_B_T (PREVOL-A2), depart conventionnel sur non-capacite RNP formulation manuel exacte (PREVOL-A3), variantes MER differee/creneau CTOT/prevoyez a 1505/prevoyez depart a 1010 + cause trafic arrivee (PREVOL-A4). Necessite nouveaux tags [TSAT] et [TOBT]. Grands aerodromes type CDG.
- **[Circulation au sol IFR · IFR]** Inspection de piste par vehicule FLYCO (SOL-A1, manuel 2261-2270: ouverture au pied de la tour, proceder au point d'attente, penetrer/inspecter, compte rendu 'piste degagee'), tractage vers zone de fret avec rappel 'tractage termine' (SOL-A2, 2348-2361), roulage complexe avec cession de priorite et cheminement via voie nommee + trafic en vue (SOL-A3, 2128-2143). Introduit 'procedez/proceed', 'penetrez', 'inspectez'.
- **[Alignement-Decollage IFR · IFR]** Multi-alignement derriere avion venu de voie intermediaire (DECO-A1), multi-alignement depuis intersection numero 1 devant avion au seuil (DECO-A2), alignement conditionnel derriere trafic arrivee/depart avec 'rappelez en vue' collationne (DECO-A3), clairance decollage annulee + injonction 'decollage immediat ou degagez' avec 2 reponses pilote (DECO-A4), apres decollage clairance conditionnelle d'axe de piste + demande de virage 'passant 2500 pieds direct [WPT]' (DECO-A5). Collationnements au present.
- **[Departs & Montee IFR · IFR]** Depart a vue proposition+acceptation+clairance (DE-A1, pilote ne collationne pas 'autorise'), guidage radar puis rejointe SID (DE-A3), annulation de restrictions SID niveau/vitesse/sans restriction (DE-A4), refus de contrainte de niveau et renegociation (DE-A5), contrainte de taux de montee/descente 'or less/or greater' (DE-A6), RVSM homologation/impossibilite/reprise (DE-A7, R_V_S_M en separateurs phonetiques).
- **[Croisiere IFR · IFR]** Description de route complexe direct/route mixtes + survol obligatoire (CROISIERE-A1), modification de clairance a l'initiative controle 'reautorise... cause activite militaire' + changement destination (A2), route parallele offset R_N_P (A3), info trafic detaillee mouvement relatif/type/altitude relative (A4, jamais de niveau de vol, 'plus haut/plus bas'), separation a vue cycle complet demande/acceptation/refus (A5), debut du service controle en vol/changement classe d'espace (A6), clarification vocale transfert CPDLC (A7), annulation IFR classe C/D avec clairance modifiee (A8).
- **[Descente & Attentes IFR · IFR]** Interrogation puis modification vitesse/mach 'mach decimale 76'/'augmentez mach decimale 78' (DESC-A1), vitesse bornee + limite altitude/position 'maintenez 300 noeuds jusqu'au niveau 120' (A2), descente via STAR avec annulation restrictions (A3), ecart de trajectoire pour sequencement puis rejointe STAR (A4), retardement en route reduction/360/attente non publiee (A5), demande et delivrance instructions d'attente completes avec eloignement radial (A6).
- **[Approche IFR · IFR]** Guidage radar + approche finale RNP avec interception d'axe 'intercepter axe d'approche finale R_N_P' (APP-A1), arrivee RNAV1/RNP1 identifiee ODILO 1A + interception RNP finale (A2), approche RNP VPT rappel au Visual Fix + remise de gaz 'Perte de visual/Remettez les gaz' (A3, uniquement a la demande equipage), approches a vue successives avec separation propre pilote 'maintain own separation from preceding' (A4, corrige aussi APP-E2).
- **[Circuit aerodrome VFR · VFR]** Sequencement dans le circuit trafic a suivre/trafic precedant 'suivez un Cessna 172 en base' vs 'trafic precedant un Cessna 172' (CIRCUIT-A1, 6573-6626), instructions de gestion espacement 'Continuez approche'/'Circuit court'/'360 par la droite'/'Allongez vent arriere' (A2, 6546-6561), modes d'integration alternatifs attente a vue verticale/approche directe/entree en base (A3, 6436-6456), continuez approche avec trafic au depart/gros porteur ed.10 'heavy' (A4). Fusionner A2/A4 (meme expression, motifs differents).
- **[Atterrissage IFR/VFR · les deux]** Annulation d'approche avant l'IF variante 'stoppez la descente altitude X pieds' + motif 'piste occupee' (ATT-A1, harmoniser FR/EN artefact manuel), instruction anticipee de remise de gaz 'en cas d'approche interrompue montez 4000 pieds dans l'axe de piste' (A2, ed.10 'on runway track'), cloture plan de vol vol non connu 1er appel indicatif complet + 'j'ecoute/pass your message' + compte rendu complet (A3, VFR).
- **[VFR Special & Transit VFR · VFR]** Depart VFR special itineraire code+altitude+transpondeur+roulage (TRANSIT-A1, verbatim manuel), refus VFR special visibilite < 1300m (A2), arrivee VFR special + attente a vue (A3), transit VFR special sur itineraire publie via waypoints + verticale aerodrome (A4), transit hors itineraire point-a-point avec estimee (A5), transit interferant avec IFR recherche contact visuel + 360 de retardement (A6). Riche materiel avance verbatim, niveau avance VFR aujourd'hui totalement vide.

---

## Détail par section

### A. Prevol

_La section Prevol du JSON est globalement fidele a l'edition 10 sur la trame (demande MER, collationnement pilote correct via verbe d'action, R_N_P bien orthographie). Deux ecarts de libelle notables : l'emploi de "montee initiale / initial climb" la ou le manuel (EXEMPLE n1 SID) dit simplement "niveau 110 / level 110", et le libelle de la MER differee ("prevoyez mise en route [HDIFF]" sans "a", et EN "expect start-up time" au lieu de "expect start-up at"). Plusieurs echanges standard du manuel sont absents (heure exacte, plan de vol, DMAN/T_SAT-T_O_B_T, "prevoyez depart a") et fournissent une bonne matiere pour le niveau avance, aujourd'hui vide._

#### Erreurs

- **PREVOL-E1** (IFR, majeur) — `MER_SIMPLE`  
  _Problème :_ Verifie et confirme. Dans l'EXEMPLE n1 SID, le niveau assigne de la clairance initiale est libelle 'niveau 110 / level 110' (ATC ligne 1911/1922 et collationnement pilote ligne 1913/1923-1924). Le JSON emploie 'montee initiale [NIV] / initial climb [NIV]'. Verification supplementaire : 'Montee initiale / Initial climb' existe bien dans le manuel mais dans un autre chapitre (lignes 6520-6521, phraseologie de depart/montee), et NON dans la clairance initiale SID de la section Prevol. Le constat est donc source-confirme : ce n'est pas le libelle de cet exemple. Note : le meme ecart affecte MER_APPROUVEE, EST_IL_RNAV et NON_RNAV (tous emploient 'montee initiale [NIV]').  
  _Actuel :_ [FR/ATC] [CAL], [POL], mise en route approuvee, depart [STA], montee initiale [NIV], transpondeur [SQU]. — [FR/Pilot] Mise en route approuvee, depart [STA], montee initiale [NIV], transpondeur [SQU], [CAL]. — [EN/ATC] ... [STA] departure, initial climb [NIV], squawk [SQU].  
  _Corrigé :_ [FR/ATC] [CAL], [POL], mise en route approuvee, depart [STA], niveau [NIV], transpondeur [SQU]. — [EN/ATC] [CAL], [POL], start-up approved, [STA] departure, level [NIV], squawk [SQU]. Aligner le collationnement pilote : '...depart [STA], niveau [NIV], transpondeur [SQU], [CAL]'. Appliquer aussi a MER_APPROUVEE / EST_IL_RNAV / NON_RNAV pour coherence.  
  _Réf. manuel :_ Ch.5 A.a Mise en route - clairance initiale - SID, EXEMPLE n1, lignes 1911 et 1913 (FR), 1922-1924 (EN)

- **PREVOL-E2** (IFR, mineur) — `MER_DIFFEREE`  
  _Problème :_ Verifie et confirme. Manuel FR (1941) : 'prevoyez mise en route a 1810 cause trafic a l'arrivee' (avec la preposition 'a'), absente du JSON. Manuel EN (1947) : 'expect start-up at 1810 due inbound traffic' ; le JSON ecrit 'expect start-up time [HDIFF]', ajoutant 'time' non present au manuel et supprimant 'at'.  
  _Actuel :_ [FR/ATC] [CAL], prevoyez mise en route [HDIFF] cause trafic a l'arrivee. — [EN/ATC] [CAL], expect start-up time [HDIFF] due inbound traffic.  
  _Corrigé :_ [FR/ATC] [CAL], prevoyez mise en route a [HDIFF] cause trafic a l'arrivee. — [EN/ATC] [CAL], expect start-up at [HDIFF] due inbound traffic.  
  _Réf. manuel :_ Ch.5 A.a EXEMPLE n2, ligne 1941 (FR), ligne 1947 (EN)

- **PREVOL-E3** (IFR, mineur) — `NON_RNAV`  
  _Problème :_ Verifie et confirme, avec precision. Le libelle de reference du manuel pour la non-capacite RNP est 'depart R_N_P impossible / unable R_N_P departure' (lignes 1964/1970). L'exemple NON RNAV du manuel ne contient QUE des transmissions ATC (aucune ligne pilote), donc le JSON compose une ligne pilote 'Impossible R_N_P zone terminale / Unable R_N_P terminal area' empruntee au contexte EST_IL_RNAV. L'objet 'depart' est perdu et l'ordre FR ne suit pas le manuel. Alignement utile pour la fidelite, meme si l'app compose librement cette replique pilote.  
  _Actuel :_ [FR/Pilot] Impossible R_N_P zone terminale, [CAL]. — [EN/Pilot] Unable R_N_P terminal area, [CAL].  
  _Corrigé :_ [FR/Pilot] Depart R_N_P impossible, [CAL]. — [EN/Pilot] Unable R_N_P departure, [CAL]. (conserver la note 'zone terminale / TMA' en info-bulle si utile)  
  _Réf. manuel :_ Ch.5 A.b Mise en route - clairance initiale - NON RNAV, EXEMPLE n1, lignes 1964-1965 (FR), 1970-1971 (EN)

- **PREVOL-E4** (IFR, mineur) — `DEMANDE_MISE_EN_ROUTE`  
  _Problème :_ Verifie et confirme cote EN ; FR RAS. Manuel EN (1919-1920) : 'stand D 8, request start-up, destination Lyon' ; le JSON EN dit 'gate [POS], request startup to [ARR]'. Ecarts confirmes : 'gate' au lieu de 'stand' (le manuel emploie systematiquement 'stand', ex. lignes 1919, 2012), 'startup to' au lieu de 'request start-up, destination', et 'startup' sans trait d'union alors que le manuel ecrit 'start-up'. Cote FR, 'en [POS]' (='en D 8') et 'pour [ARR]' (='pour Lyon') sont conformes : RAS.  
  _Actuel :_ [EN/Pilot] [DEP] [NDEL], [POL], [CAL] gate [POS], request startup to [ARR], information [INF].  
  _Corrigé :_ [EN/Pilot] [DEP] [NDEL], [POL], [CAL] stand [POS], request start-up destination [ARR], information [INF]. (aligner 'start-up' avec trait d'union ; FR inchange)  
  _Réf. manuel :_ Ch.5 A.a EXEMPLE n1, lignes 1908-1909 (FR), 1919-1920 (EN)

#### Manquements

- **PREVOL-G1** (IFR) — Demande d'heure exacte  
  Verifie et confirme. 'Demande heure exacte / Request time check' et sa reponse 'Il est 10 heures 22 / Time 1022' (lignes 1848-1849) sont au manuel et absentes des taches Prevol du JSON. Le tag [HOU] existe deja (utilise dans PARAMETRES) pour rendre l'heure.  
  _Échange proposé :_ [FR/Pilot] [CAA], demande heure exacte. — [FR/ATC] [CAA], il est [HOU]. — [EN/Pilot] [CAA], request time check. — [EN/ATC] [CAA], time [HOU].  
  _Réf. manuel :_ Ch.5 A.1 Generalites, EXPRESSIONS, lignes 1848-1849

- **PREVOL-G2** (IFR) — Verification du plan de vol  
  Verifie et confirme pour la question pilote. 'Avez-vous notre plan de vol pour L F M L ? / Do you have our flight plan destination L F M L?' (lignes 1852-1854) est au manuel et absente du JSON. Nota : le manuel ne donne pas de reponse ATC ; la reponse proposee ci-dessous est un remplissage plausible non issu du manuel.  
  _Échange proposé :_ [FR/Pilot] [CAA], avez-vous notre plan de vol pour [ARR] ? — [FR/ATC] [CAA], affirm, plan de vol recu. — [EN/Pilot] [CAA], do you have our flight plan destination [ARR]? — [EN/ATC] [CAA], affirm, flight plan received. (reponse ATC = composition app, non textuelle au manuel)  
  _Réf. manuel :_ Ch.5 A.1 Generalites, EXPRESSIONS, lignes 1852-1854

- **PREVOL-G3** (IFR) — Prevision de depart  
  Verifie et confirme. 'Prevoyez depart a 1010 / Expect departure at 1010' (lignes 1899-1900) figure au manuel, distincte de 'prevoyez mise en route', et est absente du JSON. Utile comme reponse ATC alternative a la demande de MER.  
  _Échange proposé :_ [FR/ATC] [CAL], prevoyez depart a [HDIFF]. — [EN/ATC] [CAL], expect departure at [HDIFF].  
  _Réf. manuel :_ Ch.5 A.a EXPRESSIONS, lignes 1899-1900

- **PREVOL-G4** (IFR) — Rappel pret au repoussage sur frequence Sol  
  Verifie et REFORMULE : le diagnostic initial 'sans frequence explicite' est imprecis (le tag [GND] rend justement la frequence Sol). Les vrais ecarts confirmes vs manuel (1914-1915 / 1925-1926 : 'rappelez pret au repoussage sur Merignac Sol 121,9' / 'report ready for push-back on Merignac Ground 121,9') sont : (a) le JSON dit 'pret POUR LE repoussage' au lieu de 'pret AU repoussage' ; (b) le mot de type de station 'Sol / Ground' manque ('sur [DEP] [GND]' rend 'sur Merignac 121.9' sans 'Sol') ; (c) EN sans 'on'. Present dans MER_SIMPLE (l.851), MER_APPROUVEE (l.389), MER_OMNI (l.381).  
  _Échange proposé :_ [FR/ATC] [CAL], correct, rappelez pret au repoussage sur [DEP] Sol [GND]. — [EN/ATC] [CAL], correct, report ready for push-back on [DEP] Ground [GND]. (utiliser le tag existant [GND] pour la frequence ; ajouter le mot 'Sol/Ground' et corriger 'au repoussage')  
  _Réf. manuel :_ Ch.5 A.a EXEMPLE n1, lignes 1914-1915 (FR), 1925-1926 (EN)

#### Propositions niveau Avancé

- **PREVOL-A1** (IFR) — Clairance initiale avec DMAN (T_SAT / T_O_B_T)  
  Verifie et confirme. La procedure DMAN (T_SAT / T_O_B_T) de la section c. (lignes 1979-2018) est entierement absente du JSON. Procedure des grands aerodromes (ex. CDG dans l'exemple), ideale pour le niveau avance. Le manuel emploie bien 'niveau [NIV]' (coherent avec la correction E1) et non 'montee initiale'. Necessitera des tags [TSAT] et [TOBT].  
  _Contenu proposé :_ [FR/Pilot] [DEP] [NDEL], [POL], [CAL] en [POS], pret au depart, information [INF]. — [FR/ATC] [CAL], prevoyez piste [RWY], depart [STA], niveau [NIV], T_SAT [TSAT], transpondeur [SQU], rappelez pret pour la mise en route. — [FR/Pilot] Piste [RWY], depart [STA], niveau [NIV], T_SAT [TSAT], transpondeur [SQU], je rappelle pret pour la mise en route, [CAL]. — [EN/Pilot] [DEP] [NDEL], [POL], [CAL] stand [POS], ready for departure, information [INF]. — [EN/ATC] [CAL], expect runway [RWY], [STA] departure, level [NIV], T_SAT [TSAT], squawk [SQU], report ready for start up. — [EN/Pilot] Runway [RWY], [STA] departure, level [NIV], T_SAT [TSAT], squawk [SQU], calling you back ready for start up, [CAL].  
  _Réf. manuel :_ Ch.5 A.c Mise en route - clairance initiale avec DMAN, EXPRESSIONS lignes 1987-1992 et EXEMPLE lignes 2001-2007 (FR) / 2012-2018 (EN)

- **PREVOL-A2** (IFR) — Mise a jour du T_O_B_T (DMAN)  
  Verifie et confirme. 'Mettez a jour votre T_O_B_T / Update your T_O_B_T' (lignes 1991-1992) est au manuel et absent du JSON. Echange court avance lie a la sequence DMAN. Le manuel ne donne que l'instruction ; la replique pilote de collationnement ci-dessous est une composition app plausible.  
  _Contenu proposé :_ [FR/ATC] [CAL], mettez a jour votre T_O_B_T. — [FR/Pilot] Je mets a jour mon T_O_B_T, [CAL]. — [EN/ATC] [CAL], update your T_O_B_T. — [EN/Pilot] Updating T_O_B_T, [CAL].  
  _Réf. manuel :_ Ch.5 A.c EXPRESSIONS, lignes 1991-1992

- **PREVOL-A3** (IFR) — Depart conventionnel sur non-capacite RNP (formulation manuel exacte)  
  Verifie et confirme. Fournit la formulation de reference exacte du manuel ('depart R_N_P impossible' -> 'prevoyez un depart conventionnel' / 'unable R_N_P departure' -> 'expect conventional departure'), en complement de la correction PREVOL-E3 de la tache intermediaire. Nota : l'exemple NON RNAV du manuel se limite a ces deux phrases ATC et NE precise PAS [STA]/[NIV]/[SQU] ; l'ajout de ces elements ci-dessous est une composition pedagogique coherente avec la structure de clairance SID.  
  _Contenu proposé :_ [FR/ATC] [CAL], depart R_N_P impossible. — [FR/ATC] [CAL], prevoyez un depart conventionnel [STA], niveau [NIV], transpondeur [SQU]. — [FR/Pilot] Depart conventionnel [STA], niveau [NIV], transpondeur [SQU], [CAL]. — [EN/ATC] [CAL], unable R_N_P departure. — [EN/ATC] [CAL], expect conventional departure [STA], level [NIV], squawk [SQU]. — [EN/Pilot] Conventional departure [STA], level [NIV], squawk [SQU], [CAL].  
  _Réf. manuel :_ Ch.5 A.b Mise en route - clairance initiale - NON RNAV, EXEMPLE n1, lignes 1964-1965 (FR), 1970-1971 (EN)

- **PREVOL-A4** (IFR) — MER differee / creneau (variantes avancees)  
  Verifie et confirme. Le manuel liste (EXPRESSIONS a. lignes 1893-1900) trois reponses ATC distinctes a la demande de MER : 'Mise en route approuvee C_TOT 0930', 'Prevoyez mise en route a 1505', 'Prevoyez depart a 1010' ; plus le cas 'cause trafic a l'arrivee' de l'EXEMPLE n2 avec la formulation exacte 'a' / 'at'. Bon regroupement avance.  
  _Contenu proposé :_ [FR/ATC] [CAL], mise en route approuvee C_TOT [HDIFF]. — [FR/ATC] [CAL], prevoyez mise en route a [HDIFF]. — [FR/ATC] [CAL], prevoyez depart a [HDIFF]. — [FR/ATC] [CAL], prevoyez mise en route a [HDIFF] cause trafic a l'arrivee. — [EN/ATC] [CAL], start-up approved C_TOT [HDIFF]. — [EN/ATC] [CAL], expect start-up at [HDIFF]. — [EN/ATC] [CAL], expect departure at [HDIFF]. — [EN/ATC] [CAL], expect start-up at [HDIFF] due inbound traffic.  
  _Réf. manuel :_ Ch.5 A.a EXPRESSIONS lignes 1893-1900 et EXEMPLE n2 lignes 1940-1947

### B. Circulation au sol

_La section "Circulation au sol" est globalement bien couverte cote IFR (repoussage standard/conditionnel, roulage standard/avec trafic, maintien, traversee, remontee) et VFR (roulage via TAXI/PRET_DEPART, priorite trafic, traversee). Quelques collationnements pilote et un libelle de maintien avant piste s'ecartent de l'edition 10. Manquent surtout : le tractage (chapitre B.6, absent), l'intervention/traversee de piste par vehicule (B.4, "procedez/proceed" vs "roulez/taxi"), et plusieurs expressions de roulage standard ("suivez", "remontez piste", "roulez via piste") non exposees. Le niveau avance est vide alors que cette section offre de bons scenarios composes (repoussage conditionnel enchaine, inspection de piste, tractage)._

#### Erreurs

- **SOL-E1** (IFR, majeur) — `REPOUSSAGE_CONDITIONNEL`  
  _Problème :_ Verifie contre le JSON (ligne 408) et le manuel. Le collationnement pilote EN reprend la clairance ATC 'Push-back approved' au lieu du verbe d'action. Le pilote ne repete pas une expression reservee ATC : il annonce son action ('Pushing back'). La version FR (ligne 406 'Je repousse en fonction du Boeing 737 en vue') est correcte, l'EN ne lui correspond pas. Le manuel ne donne pas de readback conditionnel explicite mais la regle ed.10 impose le verbe d'action.  
  _Actuel :_ [EN/Pilot] Push-back approved, according to 737 in sight, [CAL].  
  _Corrigé :_ [EN/Pilot] Pushing back, according to 737 in sight, [CAL].  
  _Réf. manuel :_ B.1 Repoussage, exemple lignes 2054-2064 (+ regle ed.10 verbe d'action)

- **SOL-E2** (IFR, majeur) — `MAINTIEN_ARRET`  
  _Problème :_ Verifie contre le JSON (ligne 460) et le manuel. Le collationnement pilote EN 'Maintaining short of runway' n'existe pas dans le manuel : le readback standard est construit sur le verbe 'hold' ('Holding position', 'Holding short of next intersection', 'Holding short of holding point C 1', 'Holding short of holding point runway 27 left'). 'Maintaining' n'est pas la formulation OACI/ed.10. Le FR 'Je maintiens' (ligne 458) est en revanche correct.  
  _Actuel :_ [EN/Pilot] Maintaining short of runway [RWY], taxiway [HLD], [CAL].  
  _Corrigé :_ [EN/Pilot] Holding short of holding point runway [RWY] [HLD], [CAL].  
  _Réf. manuel :_ B.3 Maintien de position, readbacks lignes 2181, 2185, 2214, 2223

- **SOL-E3** (IFR, majeur) — `MAINTIEN_ARRET`  
  _Problème :_ Verifie contre le JSON (ligne 457) et le manuel. Pour un maintien avant une piste, le manuel impose 'Maintenez avant point d'attente piste 27 gauche' / 'Hold short of holding point runway 27 left' (lignes 2216-2223) et precise (2205-2209) que le mot 'piste/runway' est reserve aux clairances decollage/atterrissage/traversee sauf necessite. Le JSON omet 'point d'attente' et ecrit 'avant piste [RWY] taxiway [HLD]', exposant le mot piste hors usage reserve et deviant du libelle du manuel.  
  _Actuel :_ [FR/ATC] [CAL], maintenez avant piste [RWY] taxiway [HLD].  
  _Corrigé :_ [FR/ATC] [CAL], maintenez avant point d'attente piste [RWY] [HLD]. / [EN/ATC] [CAL], hold short of holding point runway [RWY] [HLD].  
  _Réf. manuel :_ B.3 Maintien de position - Avant une piste, lignes 2205-2223

- **SOL-E4** (IFR, mineur) — `REPOUSSAGE_CONDITIONNEL`  
  _Problème :_ Verifie contre le JSON (lignes 405, 407) et le manuel. Cote ATC EN le JSON epele 'Boeing 7 3 7' alors que le manuel (2063-2064) et le cote FR du JSON (ligne 405 'Boeing 737') ecrivent le type non epele. Incoherence interne FR/EN et ecart au manuel. Secondaire : le manuel ecrit 'pushback' en un mot partout (2040, 2045, 2064) alors que REPOUSSAGE_STANDARD ecrit 'push-back' avec trait d'union (ligne 400) ; a uniformiser en 'pushback'.  
  _Actuel :_ [EN/ATC] [CAL], according to Boeing 7 3 7 taxiing behind you, pushback approved.  
  _Corrigé :_ [EN/ATC] [CAL], according to Boeing 737 taxiing behind you, pushback approved.  
  _Réf. manuel :_ B.1 Repoussage, exemple ligne 2063-2064

#### Manquements

- **SOL-G1** (IFR) — Tractage  
  Verifie : aucune tache ne contient 'tract'/'tow' (grep negatif). Le tractage est une sous-section a part entiere (B.6) avec expressions et exemple complet. Reclasse en IFR : l'exemple manuel est un contexte aeroport/fret (Saint-Ex), pertinent surtout IFR/commercial, pas VFR leger. Echange standard : demande de tractage, approbation via voie de circulation, rappel 'tractage termine'.  
  _Échange proposé :_ [FR/Pilot] [DEP] [NGND], [POL], [CAL], poste [POS], demande tractage pour la zone de fret.
[FR/ATC] [CAL], tractage approuve via taxiway [VOI], rappelez tractage termine.
[FR/Pilot] Je tracte via taxiway [VOI], [CAL].
[EN/Pilot] [DEP] [NGND], [POL], [CAL], stand [POS], request tow to cargo area.
[EN/ATC] [CAL], tow approved via [VOI], report tow terminated.
[EN/Pilot] Towing via [VOI], [CAL].  
  _Réf. manuel :_ B.6 Tractage, expressions lignes 2331-2340, exemple Saint-Ex lignes 2348-2361

- **SOL-G2** (IFR) — Traversee de piste par vehicule (FLYCO)  
  Verifie : aucune tache vehicule/FLYCO dans le JSON. Le manuel distingue explicitement (NB 2078-2079, sous section B.2 Roulage) la phraseologie vehicule par 'procedez/proceed' vs 'roulez/taxi', et l'exemple B.4 (2245-2255) donne la traversee de piste par vehicule avec rappel 'piste degagee'. Ref corrigee : le NB est en B.2, l'exemple traversee en B.4. Valeur secondaire car l'app est un entraineur pilote, mais le manuel y consacre une sous-section dediee.  
  _Échange proposé :_ [FR/Vehicule] FLYCO, point d'attente [HLD], demande traversee piste [RWY].
[FR/ATC] FLYCO, traversez piste [RWY], rappelez piste degagee.
[FR/Vehicule] Je traverse la piste [RWY] et rappelle piste degagee, FLYCO.
[FR/Vehicule] FLYCO, piste degagee, demande a proceder parking [POS].
[FR/ATC] FLYCO, procedez jusqu'au parking [POS].
[EN/Vehicule] FLYCO, holding point [HLD], request crossing runway [RWY].
[EN/ATC] FLYCO, cross runway [RWY], report runway vacated.
[EN/Vehicule] Crossing runway [RWY], will report runway vacated, FLYCO.  
  _Réf. manuel :_ NB 'procedez/proceed' vs 'roulez/taxi' en B.2 lignes 2078-2079 ; traversee vehicule en B.4 exemple lignes 2245-2255

- **SOL-G3** (les deux) — Instructions de roulage : Suivez / Remontez piste (hors alignement)  
  Verifie. 'Suivez/Follow' (2100-2101) n'est present nulle part dans le JSON (grep negatif) : gap reel, echange court et frequent. 'Remontez piste/Backtrack' comme instruction de roulage simple (2115-2116) est en revanche deja couvert en substance par REMONTEE_PISTE (ligne 428, couple a alignez-vous/attendez) et DEGAGEMENT_REMONTEE (180 pour degager) ; la variante standalone est marginale. La vraie valeur du gap est l'echange 'Suivez/Follow'.  
  _Échange proposé :_ [FR/ATC] [CAL], suivez le trafic precedent.
[FR/Pilot] Je suis le trafic precedent, [CAL].
[EN/ATC] [CAL], follow preceding traffic.
[EN/Pilot] Following preceding traffic, [CAL].  
  _Réf. manuel :_ B.2 Roulage, expressions 'Suivez/Follow' lignes 2100-2101, 'Remontez piste/Backtrack' lignes 2115-2116

- **SOL-G4** (IFR) — Maintien de position simple (sans piste ni intersection)  
  Verifie. Le cas general nu 'Maintenez position'/'Je maintiens position' (2180-2181) n'existe cote IFR circulation au sol que fondu dans TRAFIC_SOL (avec un motif, ligne 747) ou dans DECOL_ANNULE (contexte annulation decollage, lignes 807-809). Le maintien de position simple pour la circulation au sol merite un echange dedie court, meme si la formule 'Je maintiens position' apparait deja ailleurs. Valeur faible mais valide.  
  _Échange proposé :_ [FR/ATC] [CAL], maintenez position.
[FR/Pilot] Je maintiens position, [CAL].
[EN/ATC] [CAL], hold position.
[EN/Pilot] Holding position, [CAL].  
  _Réf. manuel :_ B.3 Maintien de position - Cas general, lignes 2180-2181

#### Propositions niveau Avancé

- **SOL-A1** (IFR) — Inspection de piste par vehicule (FLYCO)  
  Verifie contre le manuel (2261-2270). Scenario avance complet et source : ouverture au pied de la tour, autorisation de proceder au point d'attente, penetration et inspection de piste, compte rendu 'piste degagee'. Illustre 'procedez/proceed', 'penetrez', 'inspectez' propres au vehicule. Niche (vehicule) mais le niveau avance est vide et le scenario est riche et fidele au manuel.  
  _Contenu proposé :_ [FR/Vehicule] [DEP] Tour, FLYCO, [POL].
[FR/ATC] FLYCO, j'ecoute.
[FR/Vehicule] FLYCO, au pied de la tour, demande a proceder point d'attente [HLD] pour inspection de piste.
[FR/ATC] FLYCO, procedez et rappelez point d'attente [HLD].
[FR/Vehicule] Je procede et rappelle point d'attente [HLD], FLYCO.
[FR/Vehicule] [DEP] Tour, FLYCO, point d'attente [HLD], demande remontee piste [RWY].
[FR/ATC] FLYCO, penetrez, piste [RWY] inspectez, rappelez piste degagee [HLD].
[FR/ATC] FLYCO, piste degagee [HLD].
[EN/Vehicule] [DEP] Tower, FLYCO, [POL].
[EN/ATC] FLYCO, pass your message.
[EN/Vehicule] FLYCO, at the foot of the tower, request to proceed holding point [HLD] for runway inspection.
[EN/ATC] FLYCO, proceed and report holding point [HLD].
[EN/Vehicule] Proceeding and reporting holding point [HLD], FLYCO.  
  _Réf. manuel :_ B.4 Intervention sur piste par vehicule - inspection piste, lignes 2261-2270

- **SOL-A2** (IFR) — Tractage vers zone de fret avec rappel de fin  
  Verifie contre le manuel (2348-2361). Scenario avance de tractage source : ouverture indicatif abrege, message complet (poste + destination fret), approbation via voie nommee, rappel 'tractage termine'. Colle a l'exemple ('tractage approuve via taxiway T F, rappelez tractage termine' / 'tow approved via T F, report tow terminated'). Bon materiel avance.  
  _Contenu proposé :_ [FR/Pilot] [DEP] Sol, [POL], [CAA].
[FR/ATC] [CAA], j'ecoute.
[FR/Pilot] Poste [POS], demande tractage pour la zone de fret, [CAA].
[FR/ATC] [CAA], tractage approuve via taxiway [VOI], rappelez tractage termine.
[FR/Pilot] Je tracte via taxiway [VOI], [CAA].
[EN/Pilot] [DEP] Ground, [POL], [CAA].
[EN/ATC] [CAA], pass your message.
[EN/Pilot] Stand [POS], request tow to cargo area, [CAA].
[EN/ATC] [CAA], tow approved via [VOI], report tow terminated.
[EN/Pilot] Towing via [VOI], [CAA].  
  _Réf. manuel :_ B.6 Tractage, exemple Saint-Ex, lignes 2348-2361

- **SOL-A3** (IFR) — Roulage complexe avec cession de priorite et cheminement  
  Verifie contre le manuel (2128-2143). Version avance de ROULAGE_TRAFIC (ligne 422, qui n'a ni 'via [VOI]' ni le prefixe 'Airbus en vue'). Reprend l'exemple integral : laisser passer un trafic identifie venant d'un cote precis, autorisation vers le point d'attente via une voie nommee, collationnement complet 'Airbus en vue, je laisse passer... et roule point d'attente piste 27 via B 7'. Ajoute reellement le cheminement et le trafic en vue par rapport au base. Bon materiel avance.  
  _Contenu proposé :_ [FR/Pilot] [CAL], demande roulage.
[FR/ATC] [CAL], laissez passer l'Airbus d'Air France venant de votre droite, roulez point d'attente piste [RWY] via [VOI].
[FR/Pilot] Airbus en vue, je laisse passer l'Airbus d'Air France et roule point d'attente piste [RWY] via [VOI], [CAL].
[EN/Pilot] [CAL], request taxi.
[EN/ATC] [CAL], give way to Air France Airbus coming from your right, taxi holding point runway [RWY] via [VOI].
[EN/Pilot] Airbus in sight, giving way to Air France Airbus, taxiing holding point runway [RWY] via [VOI], [CAL].  
  _Réf. manuel :_ B.2 Roulage - exemple IFR avec priorite, lignes 2128-2143

### C. Alignement - Decollage

_La section C (Alignement-Décollage) est globalement bien alignée sur l'édition 10 : les clairances d'alignement ("alignez-vous et attendez/line up and wait"), les autorisations de décollage et le collationnement pilote par verbe d'action ("je décolle/taking-off", "je m'aligne", "je stoppe", "j'interromps décollage") sont corrects, sans reprise des expressions réservées. Quelques défauts subsistent : emploi de "terrain" au lieu de "aérodrome" (EXERCICE), collationnements au futur au lieu du présent (ALIGNEMENT_APRES_AVION_FINAL), et une formulation EN non conforme dans DECOLLAGE_IMMEDIAT. Plusieurs échanges standard du manuel manquent (préparatifs "prêt au départ", départ depuis intersection avec TORA, alignement conditionnel, "après le décollage"), et le niveau avancé est entièrement à alimenter avec le multi-alignement, l'alignement conditionnel et les instructions d'axe de piste._

#### Erreurs

- **DECO-E1** (VFR, mineur) — `EXERCICE`  
  _Problème :_ Le texte FR emploie 'verticale terrain' (ATC et Pilote). En édition 10 le terme 'terrain' est remplacé par 'aérodrome' (changement explicité l.72 du manuel, usage phraséologique 'verticale aérodrome' l.7585-7588). La version EN dit déjà 'over airfield', d'où une incohérence FR/EN au sein de la même tâche.  
  _Actuel :_ [FR/ATC] ...rappelez verticale terrain [ALT] pieds. / [FR/Pilot] ...rappellerai verticale terrain [ALT] pieds  
  _Corrigé :_ Remplacer 'verticale terrain' par 'verticale aérodrome' dans les deux lignes FR. ATC: '...rappelez verticale aérodrome [ALT] pieds.' ; Pilote: '...rappellerai verticale aérodrome [ALT] pieds, [CAA].'  
  _Réf. manuel :_ Ch.5 - note édition 10 (manuel l.72 : « Le terme terrain est remplacé par le terme aérodrome ») ; usage correct « verticale aérodrome » l.7585-7588

- **DECO-E2** (VFR, mineur) — `ALIGNEMENT_APRES_AVION_FINAL`  
  _Problème :_ Le collationnement pilote VFR est au futur ('je m'aligne et attendrai / will line up and wait'), alors que le manuel collationne l'alignement conditionnel au présent (l.2703-2704 FR 'je m'aligne et attends', l.2712-2713 EN 'lining up and waiting'). La version IFR de la même tâche (id=ALIGNEMENT_APRES_AVION_FINAL, JSON l.438/442) utilise correctement le présent, d'où une incohérence entre les deux modes.  
  _Actuel :_ [FR/Pilot] Derrière A_T_R en finale, je m'aligne et attendrai piste [RWY] derrière, [CAA]. / [EN/Pilot] Behind A_T_R on final, will line up and wait runway [RWY] behind, [CAA].  
  _Corrigé :_ [FR/Pilot] Derrière A_T_R en finale, je m'aligne et attends piste [RWY] derrière, [CAA]. / [EN/Pilot] Behind A_T_R on final, lining up and waiting runway [RWY], [CAA]. (le manuel omet 'behind' en fin de collationnement EN)  
  _Réf. manuel :_ Ch.5 C.3.d Alignement conditionnel, phraséologie de base (l.2699-2713) : collationnement pilote au présent 'je m'aligne et attends / lining up and waiting'

- **DECO-E3** (IFR, mineur) — `DECOLLAGE_IMMEDIAT`  
  _Problème :_ La ligne EN ATC insère 'and' entre l'alignement et l'autorisation ('line up runway [RWY] and cleared for immediate take-off'). Le manuel n'emploie pas 'and' à cet endroit : 'line up runway 05 left, cleared for immediate take-off' (l.2799). La version FR ATC est correcte ('alignez-vous piste [RWY], autorisé décollage immédiat').  
  _Actuel :_ [EN/ATC] [CAL], line up runway [RWY] and cleared for immediate take-off, wind 0_5_0 degrees, 10 knots.  
  _Corrigé :_ [EN/ATC] [CAL], line up runway [RWY], cleared for immediate take-off, wind 0_5_0 degrees, 10 knots.  
  _Réf. manuel :_ Ch.5 C.4 Autorisation de décollage, exemple n°2 (l.2799) : 'line up runway 05 left, cleared for immediate take-off'

- **DECO-E4** (IFR, mineur) — `DECOLLAGE_IMMEDIAT`  
  _Problème :_ La ligne EN ATC de la question de disponibilité dit 'say if ready for immediate departure', alors que le manuel emploie 'Are you ready for immediate departure?' (l.2382, l.2797). La forme 'say if ready' n'apparaît pas dans cette section ; le FR 'êtes-vous prêt pour un départ immédiat ?' est conforme.  
  _Actuel :_ [EN/ATC] [CAL], say if ready for immediate departure.  
  _Corrigé :_ [EN/ATC] [CAL], are you ready for immediate departure?  
  _Réf. manuel :_ Ch.5 C.1 Préparatifs au départ, expression (l.2382) et exemple (l.2797) : 'Are you ready for immediate departure?'

#### Manquements

- **DECO-G1** (les deux) — Préparatifs au départ - interrogation ATC sur la disponibilité  
  Le manuel prévoit un échange standard où l'ATC demande si l'appareil est prêt (immédiat ou < 2 min) et le pilote répond Affirme/Négatif. Actuellement seul le cas 'départ immédiat' (DECOLLAGE_IMMEDIAT IFR) existe ; il manque le cas 'départ dans moins de 2 minutes' et le 'Rappelez prêt au départ / Report when ready for departure'. NB : la réplique pilote spontanée 'prêt au départ' existe déjà (PRET_DEPART1 VFR, CONTACT_TOUR1 IFR), mais pas l'interrogation ATC de disponibilité.  
  _Échange proposé :_ [FR/ATC] [CAL], êtes-vous prêt pour un départ dans moins de 2 minutes ? / [FR/Pilot] Négatif, [CAL]. / [EN/ATC] [CAL], are you ready for departure within 2 minutes? / [EN/Pilot] Negative, [CAL]. (variante 'Rappelez prêt au départ / Report when ready for departure' -> Pilote: '[CAA/CAL], au point d'attente piste [RWY], prêt au départ / holding point runway [RWY], ready for departure')  
  _Réf. manuel :_ Ch.5 C.1 Préparatifs au départ, expressions + exemple (l.2378-2405) : 'Rappelez prêt au départ / Report when ready for departure' ; 'Êtes-vous prêt pour un départ dans moins de 2 minutes?' avec réponse 'Négatif'

- **DECO-G2** (IFR) — Départ depuis une intersection - demande de TORA initiée par le pilote (IFR)  
  Le manuel décrit l'échange initié PAR LE PILOTE de départ depuis une bretelle intermédiaire avec confirmation de la TORA puis 'Demande départ à partir de la piste, intersection' (l.2419-2431). NB : la variante initiée par l'ATC ('pouvez-vous partir de la piste... TORA 1800 mètres') existe déjà côté VFR (AUTRE_POINT_ARRET) au stade roulage ; en revanche la demande pilote de TORA et l'échange en mode IFR ne sont couverts par aucune tâche.  
  _Échange proposé :_ [FR/Pilot] [CAL], confirmez distance disponible piste [RWY] à partir de l'intersection S 3 ? / [FR/ATC] [CAL], TORA piste [RWY] à partir de l'intersection S 3, 1 800 mètres. / [FR/Pilot] Demande départ à partir de la piste [RWY], intersection S 3, [CAL]. / [EN/Pilot] [CAL], confirm distance runway [RWY] available from intersection S 3? / [EN/ATC] [CAL], TORA runway [RWY] from intersection S 3, 1 800 metres. / [EN/Pilot] Request departure from runway [RWY] intersection S 3, [CAL].  
  _Réf. manuel :_ Ch.5 C.1 pilote (l.2419-2431) : 'Confirmez distance disponible piste 27 à partir de l'intersection S 3 ? / TORA piste 27... 1 800 mètres / Demande départ à partir de la piste 27, intersection S 3'

- **DECO-G3** (IFR) — Instruction d'axe de piste après décollage  
  Le manuel consacre une sous-section aux instructions de maintien d'axe/cap de piste après décollage, avec collationnement pilote au présent. Aucune tâche de l'app ne délivre ces instructions post-décollage (vérifié : aucun 'axe de piste'/'runway track'/'cap de la piste'/'runway heading' dans le JSON), pourtant très standard (respect strict de 'continue runway track', ni 'maintain runway track' ni 'track extended centre line').  
  _Échange proposé :_ [FR/ATC] [CAL], restez dans l'axe de piste. / [FR/Pilot] Je reste dans l'axe de piste, [CAL]. / [EN/ATC] [CAL], continue runway track. / [EN/Pilot] Continuing runway track, [CAL]. (variante: '[CAL], continuez au cap de la piste / continue runway heading' -> '[CAL], je continue au cap de la piste / continuing runway heading' ; ou '[CAL], montez tout droit / climb straight ahead')  
  _Réf. manuel :_ Ch.5 C.2.b L'aéronef a décollé / C.6 Après le décollage (l.2461-2468, 2927-2931) : 'Continuez au cap de la piste / Continue runway heading', 'Restez dans l'axe de piste / Continue runway track', 'Montez tout droit / Climb straight ahead'

- **DECO-G4** (IFR) — Demande de virage / clairance de virage après décollage  
  Le manuel prévoit l'échange où le pilote demande un virage et où l'ATC l'approuve (ou le refuse), ainsi que les clairances de virage à un palier ('passant 1 000 pieds dans l'axe de piste, tournez à droite') et la clairance 'direct point'. Vérifié : aucun 'virage à droite'/'right turn' dans le JSON. L'app ne propose pas ces échanges post-décollage standards.  
  _Échange proposé :_ [FR/Pilot] [CAL], demande virage à droite. / [FR/ATC] [CAL], virage à droite approuvé. / [FR/Pilot] Je vire à droite, [CAL]. / [EN/Pilot] [CAL], request right turn. / [EN/ATC] [CAL], right turn approved. / [EN/Pilot] Turning right, [CAL]. (variante direct: [FR/Pilot] [CAL], demande direct [WPT]. -> [FR/ATC] [CAL], restez dans l'axe de piste, passant 2 500 pieds direct [WPT]. -> [FR/Pilot] Je reste dans l'axe de piste, passant 2 500 pieds, direct [WPT], [CAL].)  
  _Réf. manuel :_ Ch.5 C.6 Après le décollage, expressions et exemple (l.2914-2949) : 'Demande virage à droite / Request right turn', 'Virage à droite approuvé / Right turn approved', 'Négatif', 'Passant 1 000 pieds dans l'axe de piste, tournez à droite'

- **DECO-G5** (IFR) — Décollage immédiat ou dégagement (aéronef à l'arrêt sur piste)  
  Le manuel prévoit, pour un aéronef à l'arrêt sur la piste ayant déjà reçu la clairance, l'injonction 'autorisé décollage immédiat ou dégagez la piste' avec deux réponses pilote possibles. Vérifié : seul DECOL_ANNULE ('maintenez position, annulez le décollage') existe ; l'injonction 'immediate take-off or vacate' est absente.  
  _Échange proposé :_ [FR/ATC] [CAL], autorisé décollage immédiat ou dégagez la piste. / [FR/Pilot] Je décolle immédiatement, [CAL]. (ou: Je dégage, [CAL].) / [EN/ATC] [CAL], cleared for immediate take-off or vacate runway. / [EN/Pilot] Taking-off immediately, [CAL]. (ou: Vacating, [CAL].)  
  _Réf. manuel :_ Ch.5 C.4 Autorisation de décollage, expressions (l.2822-2831) : 'Autorisé décollage immédiat ou dégagez la piste / Cleared for immediate take-off or vacate runway' avec réponses 'Je décolle immédiatement/Taking-off immediately' ou 'Je dégage/Vacating'

- **DECO-G6** (IFR) — Alignement : pilote pas au point d'attente indiqué  
  Le manuel prévoit le cas où le pilote signale ne pas être au taxiway indiqué lors d'une clairance d'alignement, et l'ATC répond par un maintien avant point d'attente et 'je vous rappelle'. Vérifié : l'app a l'alignement multi-taxiway (ALIGNEMENT_POS2) mais pas ce lever de doute où le pilote corrige sa position ('je suis à intersection'/'calling you back' absents du JSON).  
  _Échange proposé :_ [FR/ATC] [CAL], alignez-vous et attendez piste [RWY], intersection S 3. / [FR/Pilot] Négatif, je suis à intersection A 6, [CAL]. / [FR/ATC] [CAL], maintenez avant point d'attente A 6, je vous rappelle. / [EN/ATC] [CAL], line up and wait runway [RWY], intersection S 3. / [EN/Pilot] Negative, we are at intersection A 6, [CAL]. / [EN/ATC] [CAL], hold short of holding point A 6, calling you back.  
  _Réf. manuel :_ Ch.5 C.3.b exemple 'L'aéronef n'est pas sur le taxiway indiqué' (l.2557-2566) : 'Négatif, je suis à intersection A 6' / 'maintenez avant point d'attente A 6, je vous rappelle'

#### Propositions niveau Avancé

- **DECO-A1** (IFR) — Multi-alignement - s'aligner derrière un avion aligné depuis une voie intermédiaire  
  Clairance d'alignement complexe avec point d'attente, intersection et rang de départ, l'avion au seuil s'alignant derrière un avion venu d'une voie intermédiaire. Collationnement pilote au présent. Adapté au niveau avancé.  
  _Contenu proposé :_ [FR/ATC] [CAL], alignez-vous et attendez piste [RWY], intersection W 9, numéro 2 au départ. / [FR/Pilot] Je m'aligne et attends piste [RWY], intersection W 9, numéro 2 au départ, [CAL]. / [EN/ATC] [CAL], line up and wait runway [RWY], intersection W 9, number 2 for departure. / [EN/Pilot] Lining up and waiting runway [RWY], intersection W 9, number 2 for departure, [CAL].  
  _Réf. manuel :_ Ch.5 C.3.c Multi alignement, exemple n°1 (l.2609-2618) : 'alignez-vous et attendez piste 26 droite, intersection W 9, numéro 2 au départ'

- **DECO-A2** (IFR) — Multi-alignement - s'aligner depuis une intersection devant un avion au seuil  
  Deux aéronefs : l'un s'aligne depuis une intersection en 'numéro 1 devant' un Boeing 737 au seuil, et l'ATC informe l'avion au seuil du trafic partant devant lui, avec collationnement 'en vue'. Situation avancée de séquencement de départ à surveillance visuelle.  
  _Contenu proposé :_ [FR/ATC] [CAL], alignez-vous piste [RWY], intersection W 7, numéro 1 devant un Boeing 737 au seuil de piste. / [FR/Pilot] Je m'aligne piste [RWY], intersection W 7, numéro 1 devant un Boeing 737 au seuil de piste, [CAL]. / [FR/ATC] (autre vol) un Airbus 320 au départ intersection W 7, avant vous. / [FR/Pilot] (autre vol) Airbus 320 en vue. / [EN/ATC] [CAL], line up runway [RWY], intersection W 7, number 1 before a Boeing 737 at threshold. / [EN/Pilot] Lining up runway [RWY], intersection W 7, number 1 before a Boeing 737 at threshold, [CAL].  
  _Réf. manuel :_ Ch.5 C.3.c Multi alignement, exemple n°2 (l.2627-2642) : 'alignez-vous piste 26 droite, intersection W 7, numéro 1 devant un Boeing 737 au seuil de piste' + information de trafic croisé

- **DECO-A3** (IFR) — Alignement conditionnel derrière un trafic à l'arrivée ou au départ  
  Clairance conditionnelle délivrée dans l'ordre : condition précise, clairance, rappel abrégé de la condition, précédée d'un 'rappelez en vue' que le pilote collationne. Le mot 'derrière/behind' encadre la clairance. Procédure avancée exigeant identification visuelle préalable du trafic causant la condition.  
  _Contenu proposé :_ [FR/ATC] [CAL], A_T_R en finale, rappelez en vue. / [FR/Pilot] A_T_R en vue, [CAL]. / [FR/ATC] [CAL], derrière A_T_R en finale, alignez-vous et attendez piste [RWY] droite derrière. / [FR/Pilot] Derrière A_T_R en finale, je m'aligne et attends piste [RWY] droite derrière, [CAL]. / [EN/ATC] [CAL], A_T_R on final, report in sight. / [EN/Pilot] A_T_R in sight, [CAL]. / [EN/ATC] [CAL], behind A_T_R on final, line up and wait runway [RWY] right behind. / [EN/Pilot] Behind A_T_R on final, lining up and waiting runway [RWY] right, [CAL]. (variante 'derrière Airbus 320 au départ' au lieu de l'arrivée)  
  _Réf. manuel :_ Ch.5 C.3.d Alignement conditionnel, conditions et phraséologie de base (l.2649-2735) : ordre condition / clairance / rappel abrégé ; 'derrière A_T_R en finale... derrière'

- **DECO-A4** (IFR) — Gestion d'une clairance de décollage annulée / injonction décollage immédiat ou dégagement  
  Enchaînement avancé de sécurité piste : annulation de la clairance de décollage avec motif (A_T_R en remise de gaz), maintien de position, puis alternative 'décollage immédiat ou dégagez la piste' avec les deux réponses pilote possibles. Combine DECOL_ANNULE existant avec le cas de dégagement non encore couvert.  
  _Contenu proposé :_ [FR/ATC] [CAL], maintenez position, annulez le décollage, je répète, annulez le décollage, A_T_R en remise de gaz. / [FR/Pilot] Je maintiens position, [CAL]. / [FR/ATC] [CAL], autorisé décollage immédiat ou dégagez la piste. / [FR/Pilot] Je décolle immédiatement, [CAL]. (ou: Je dégage, [CAL].) / [EN/ATC] [CAL], hold position, cancel take-off, I say again cancel take-off, A_T_R going around. / [EN/Pilot] Holding position, [CAL]. / [EN/ATC] [CAL], cleared for immediate take-off or vacate runway. / [EN/Pilot] Taking-off immediately, [CAL]. (ou: Vacating, [CAL].)  
  _Réf. manuel :_ Ch.5 C.4 aéronef à l'arrêt sur piste (l.2811-2831) + exemple (l.2840-2850) : 'Maintenez position, annulez le décollage, je répète, annulez le décollage' + 'Autorisé décollage immédiat ou dégagez la piste'

- **DECO-A5** (IFR) — Après le décollage - clairance conditionnelle d'axe de piste et demande de virage  
  Après décollage (ou juste avant, l'exemple du manuel étant valable 'quand l'avion n'a pas encore décollé') : demande pilote de 'direct point', réponse ATC combinant maintien d'axe de piste et clairance conditionnelle au passage d'un palier ('passant 2 500 pieds, direct [WPT]'), ainsi que le schéma demande/approbation de virage ('virage à droite approuvé' ou 'négatif'). Contenu avancé de transition départ vers en-route.  
  _Contenu proposé :_ [FR/Pilot] [CAL], demande direct [WPT]. / [FR/ATC] [CAL], restez dans l'axe de piste, passant 2 500 pieds direct [WPT]. / [FR/Pilot] Je reste dans l'axe de piste, passant 2 500 pieds, direct [WPT], [CAL]. / [EN/Pilot] [CAL], request direct [WPT]. / [EN/ATC] [CAL], continue runway track, passing 2 500 feet, direct [WPT]. / [EN/Pilot] Continuing runway track, passing 2 500 feet, direct [WPT], [CAL]. (variante virage: [FR/Pilot] [CAL], demande virage à droite. -> [FR/ATC] [CAL], virage à droite approuvé. / ou Négatif.)  
  _Réf. manuel :_ Ch.5 C.6 Après le décollage, exemple (l.2940-2949) : 'restez dans l'axe de piste, passant 2500 pieds direct ATN' + demande/approbation de virage (l.2914-2925)

### D+E. Departs & Montee

_La section D+E (Departs & Montee) de l'app couvre surtout les transferts de frequence et la confirmation de clairance SID, avec un JSON globalement conforme a l'edition 10 (collationnement pilote correct via verbe d'action, forme abregee/complete des indicatifs). Une erreur de libelle anglais est presente (MONTEE_DIFFEREE : "stop climbing" au lieu de "stop climb") et l'id/nom de cette tache prete a confusion. Les gros manques concernent le coeur meme du chapitre : clairance de depart initiale, depart omnidirectionnel, depart a vue, contraintes de niveau (plus haut/plus bas, soyez stable), et RVSM — aucun n'est modelise, ce qui laisse le niveau avance entierement vide et exploitable._

#### Erreurs

- **DE-E1** (IFR, mineur) — `MONTEE_DIFFEREE`  
  _Problème :_ Libellé anglais de l'instruction ATC d'arrêt de montée non conforme à l'édition 10. Le manuel (l.3482) écrit "Stop climb level 90" côté ATC (le pilote collationne "Stopping climb level 90"). Le JSON ATC dit "stop climbing level [NIV]". Vérifié : JSON l.517 = "stop climbing"; manuel l.3482 = "Stop climb". Le collationnement pilote JSON "Stopping climb level [NIV]" (l.518) est déjà correct.  
  _Actuel :_ [EN/ATC] [CAL], stop climbing level [NIV].  
  _Corrigé :_ [EN/ATC] [CAL], stop climb level [NIV].  
  _Réf. manuel :_ E. MONTÉE — 1. Clairance de montée / Expressions, ligne 3482 (p.76)

- **DE-E2** (IFR, mineur) — `MONTEE_DIFFEREE`  
  _Problème :_ Problème de nommage/modélisation, non de libellé. Vérifié : la tâche id=MONTEE_DIFFEREE / nom="Montée stoppée" contient bien l'expression "Stoppez la montée niveau" (JSON l.515 = manuel l.3481). Le nom "Montée stoppée" est donc cohérent avec le contenu, mais l'id "MONTEE_DIFFEREE" induit en erreur : la vraie montée différée/intermédiaire du manuel ("Montez niveau 290, initialement", l.3296-3302) n'est PAS modélisée (confirmé : aucun "initialement/initially" de clairance de montée dans le JSON). Recommandation : renommer l'id de la tâche existante (ex. STOP_CLIMB) pour lever la confusion. Le concept de montée intermédiaire manquant est traité séparément (voir DE-G5).  
  _Actuel :_ id=MONTEE_DIFFEREE | nom="Montée stoppée" | [FR/ATC] [CAL], stoppez la montée niveau [NIV].  
  _Corrigé :_ Renommer l'id de la tâche existante (ex. STOP_CLIMB), contenu inchangé (conforme l.3481). La montée intermédiaire "initialement" reste à créer (voir DE-G5).  
  _Réf. manuel :_ E. MONTÉE — Expressions l.3481-3482 (p.76) vs Clairance de montée l.3287-3302 (p.71)

#### Manquements

- **DE-G2** (IFR) — Contrainte de niveau à un point (plus haut que)  
  Vérifié : aucun échange de contrainte de niveau "passez [WPT] plus haut que niveau" / "cross above level" dans le JSON (les occurrences "plus haut" sont des infos trafic, sans rapport). Échange standard édition 10 (règle-clé "plus haut", non "au-dessus"), absent et très formateur.  
  _Échange proposé :_ [FR/ATC] [CAL], montez niveau [NIV], passez [WPT] plus haut que niveau [NIV2].
[FR/Pilot] Je monte niveau [NIV] et passe [WPT] plus haut que niveau [NIV2], [CAL].
[EN/ATC] [CAL], climb level [NIV], cross [WPT] above level [NIV2].
[EN/Pilot] Climbing level [NIV], cross [WPT] above level [NIV2], [CAL].  
  _Réf. manuel :_ E. MONTÉE — 2. Contraintes de niveau / Phraséologie de base, lignes 3348-3356 (p.73)

- **DE-G3** (IFR) — Contrainte : soyez stable avant un point  
  Vérifié : "soyez stable avant [WPT]" / "be levelled before [WPT]" absent du JSON. Échange standard en montée sous contrainte de séquencement (manuel l.3361-3369 en montée; variante l.3399 aussi).  
  _Échange proposé :_ [FR/ATC] [CAL], montez niveau [NIV], soyez stable avant [WPT].
[FR/Pilot] Je monte niveau [NIV] et stabilise avant [WPT], [CAL].
[EN/ATC] [CAL], climb level [NIV], be levelled before [WPT].
[EN/Pilot] Climbing level [NIV], levelling before [WPT], [CAL].  
  _Réf. manuel :_ E. MONTÉE — 2. Contraintes de niveau / Phraséologie de base, lignes 3361-3369 (p.73)

- **DE-G4** (IFR) — Expédiez la montée  
  Vérifié : "expédiez la montée à travers niveau" absent du JSON (les hits "expédiez/expedite" concernent uniquement le roulage et le dégagement de piste, pas la montée). Expression standard courte, utile en simu (contexte contrôle d'approche).  
  _Échange proposé :_ [FR/ATC] [CAL], montez niveau [NIV], expédiez la montée à travers niveau [NIV2].
[FR/Pilot] Je monte niveau [NIV] et expédie la montée à travers niveau [NIV2], [CAL].
[EN/ATC] [CAL], climb level [NIV], expedite climb until passing level [NIV2].
[EN/Pilot] Climbing level [NIV], expediting climb until passing level [NIV2], [CAL].  
  _Réf. manuel :_ E. MONTÉE — 1. Clairance de montée / Expressions, lignes 3279-3282 (p.71)

- **DE-G5** (IFR) — Montée vers niveau intermédiaire (initialement) — sur demande pilote  
  Vérifié : demande pilote "Demande niveau 330" + clairance intermédiaire "Montez niveau 290, initialement" + collationnement "Je monte niveau 290" absents du JSON (aucun "initialement/initially" de clairance de montée). Standard de montée initié par le pilote. Répond aussi au manque signalé en DE-E2 (vraie montée différée).  
  _Échange proposé :_ [FR/Pilot] Demande niveau [NIV], [CAL].
[FR/ATC] [CAL], montez niveau [NIV2], initialement.
[FR/Pilot] Je monte niveau [NIV2], [CAL].
[EN/Pilot] Request level [NIV], [CAL].
[EN/ATC] [CAL], climb level [NIV2], initially.
[EN/Pilot] Climbing level [NIV2], [CAL].  
  _Réf. manuel :_ E. MONTÉE — 1. Clairance de montée / Expressions, lignes 3287-3302 (p.71)

- **DE-G6** (IFR) — Rappelez libérant niveau  
  Vérifié : l'instruction ATC "Rappelez libérant niveau" / "Report leaving level" avec collationnement pilote n'existe pas comme échange autonome. Contenu adjacent seulement : DESCENTE_DELAI (l.569, 573) contient un compte-rendu pilote spontané "libère le niveau XXX en descente" / "leaving level XXX, descending", ce qui n'est pas l'instruction ATC + accusé de réception. Expression standard très courante en montée.  
  _Échange proposé :_ [FR/ATC] [CAL], rappelez libérant niveau [NIV].
[FR/Pilot] Je rappelle libérant niveau [NIV], [CAL].
[EN/ATC] [CAL], report leaving level [NIV].
[EN/Pilot] Reporting leaving level [NIV], [CAL].  
  _Réf. manuel :_ E. MONTÉE — 1. Clairance de montée / Expressions, lignes 3476-3477 (p.76)

#### Propositions niveau Avancé

- **DE-A1** (IFR) — Départ à vue (proposition + clairance + collationnement)  
  Vérifié : procédure de départ à vue IFR absente du JSON. Combine proposition contrôleur, acceptation pilote (Affirme), puis clairance complète avec maintien de référence visuelle — idéal niveau avancé. Pilote ne collationne PAS "autorisé" et reprend l'action ("Départ à vue direct jusqu'à..."), conforme édition 10.  
  _Contenu proposé :_ [FR/ATC] [CAL], acceptez-vous départ à vue direct jusqu'à [WPT], niveau [NIV] ?
[FR/Pilot] Affirme, départ à vue direct jusqu'à [WPT], niveau [NIV], [CAL].
[FR/ATC] [CAL], autorisé départ à vue piste [RWY], tournez à droite direct jusqu'à [WPT], niveau [NIV], maintenez référence visuelle jusqu'à altitude 3 500 pieds.
[FR/Pilot] Départ à vue direct jusqu'à [WPT], niveau [NIV], [CAL].
[EN/ATC] [CAL], advise able to accept visual departure direct to [WPT], level [NIV].
[EN/Pilot] Affirm, visual departure to [WPT], level [NIV], [CAL].
[EN/ATC] [CAL], cleared visual departure runway [RWY], turn right direct to [WPT], level [NIV], maintain visual reference until altitude 3 500 feet.
[EN/Pilot] Visual departure [WPT], level [NIV], [CAL].  
  _Réf. manuel :_ D. DÉPARTS — 3. Départ à vue / Phraséologie de base, lignes 3231-3253 (p.70)

- **DE-A3** (IFR) — Guidage puis rejointe du SID (radar vectoring)  
  Vérifié : séquence "cap cause trafic, prévoyez de rejoindre SID" puis "procédez direct, rejoignez SID, montez via SID" absente du JSON. DIRECT_WPT (l.508) couvre seulement "procédez direct [WPT], montez via SID" sans le volet guidage/rejointe. Combine cap, cause, prévision de rejointe et clairance directe — typiquement avancé.  
  _Contenu proposé :_ [FR/ATC] [CAL], tournez à gauche cap 060 cause trafic, montez niveau [NIV], prévoyez de rejoindre SID.
[FR/Pilot] Je tourne à gauche cap 060, monte niveau [NIV], prévois de rejoindre SID, [CAL].
[FR/ATC] [CAL], procédez direct [WPT], rejoignez SID, montez via SID niveau [NIV2].
[FR/Pilot] Direct [WPT], je rejoins SID, monte via SID niveau [NIV2], [CAL].
[EN/ATC] [CAL], turn left heading 060 due traffic, climb level [NIV], expect to rejoin SID.
[EN/Pilot] Turning left heading 060, climbing level [NIV], expecting to rejoin SID, [CAL].
[EN/ATC] [CAL], proceed direct [WPT], rejoin SID, climb via SID level [NIV2].
[EN/Pilot] Direct [WPT], rejoining SID, climbing via SID level [NIV2], [CAL].  
  _Réf. manuel :_ D. DÉPARTS — 1. Clairance de départ / Phraséologie complémentaire, lignes 3046-3071 (p.66)

- **DE-A4** (IFR) — Annulation de restrictions SID (niveau / vitesse / sans restriction)  
  Vérifié : les trois variantes d'annulation de contraintes SID (annulez restriction de niveau à [WPT]; annulez restrictions de vitesse; montez sans restriction niveau) sont absentes du JSON. Le manuel présente uniquement les lignes ATC sans collationnement pilote — cohérent avec le proposé. Niveau avancé.  
  _Contenu proposé :_ [FR/ATC] [CAL], montez via SID niveau [NIV], annulez restriction de niveau à [WPT].
[FR/ATC] [CAL], montez via SID niveau [NIV], annulez restrictions de vitesse.
[FR/ATC] [CAL], montez sans restriction niveau [NIV].
[EN/ATC] [CAL], climb via SID level [NIV], cancel level restriction at [WPT].
[EN/ATC] [CAL], climb via SID level [NIV], cancel speed restrictions.
[EN/ATC] [CAL], climb level [NIV] unrestricted.  
  _Réf. manuel :_ D. DÉPARTS — 1. Clairance de départ / Phraséologie complémentaire, lignes 3093-3114 (p.67)

- **DE-A5** (IFR) — Refus de contrainte de niveau et renégociation  
  Vérifié : échange "Négatif, niveau X possible avant [WPT]" + reformulation ATC absent du JSON. Le manuel l'illustre en descente (soyez stable avant CIV -> Négatif niveau 160 possible -> descendez niveau 180), cohérent avec le proposé. Illustre l'obligation pilote de signaler l'impossibilité au plus tôt. Avancé.  
  _Contenu proposé :_ [FR/ATC] [CAL], descendez niveau [NIV], soyez stable avant [WPT].
[FR/Pilot] Négatif, niveau [NIV2] possible avant [WPT], [CAL].
[FR/ATC] [CAL], descendez niveau [NIV2].
[FR/Pilot] Je descends niveau [NIV2], [CAL].
[EN/ATC] [CAL], descend level [NIV], be levelled before [WPT].
[EN/Pilot] Negative, level [NIV2] possible before [WPT], [CAL].
[EN/ATC] [CAL], descend level [NIV2].
[EN/Pilot] Descending level [NIV2], [CAL].  
  _Réf. manuel :_ E. MONTÉE — 2. Contraintes de niveau / Phraséologie complémentaire, lignes 3437-3459 (p.75)

- **DE-A6** (IFR) — Contrainte de taux de montée/descente  
  Vérifié : instruction de taux imposé absente du JSON. TAUX_MONTEE (l.836) ne couvre que la question "quel est votre taux de montée ?" + compte-rendu pilote (manuel l.3471-3472), PAS l'instruction "taux 1 500 pieds par minute maximum/minimum" (l.3486-3497). EN "or less/or greater" conforme. Avancé.  
  _Contenu proposé :_ [FR/ATC] [CAL], montez niveau [NIV], taux 1 500 pieds par minute maximum.
[FR/Pilot] Je monte niveau [NIV], taux 1 500 pieds par minute maximum, [CAL].
[FR/ATC] [CAL], descendez niveau [NIV], taux 1 500 pieds par minute minimum.
[FR/Pilot] Je descends niveau [NIV], taux 1 500 pieds par minute minimum, [CAL].
[EN/ATC] [CAL], climb level [NIV], rate 1 500 feet per minute or less.
[EN/Pilot] Climbing level [NIV], rate 1 500 feet per minute or less, [CAL].
[EN/ATC] [CAL], descend level [NIV], rate 1 500 feet per minute or greater.
[EN/Pilot] Descending level [NIV], rate 1 500 feet per minute or greater, [CAL].  
  _Réf. manuel :_ E. MONTÉE — 2. Contraintes de niveau / Expressions taux, lignes 3486-3497 (p.76)

- **DE-A7** (IFR) — RVSM (homologation, impossibilité, reprise)  
  Vérifié : aucun contenu RVSM dans le JSON. Le manuel couvre confirmation d'homologation, réponses (Affirme / Négatif / aéronef d'État), impossibilité de maintien, reprise, et clairance impossible vers espace RVSM avec maintien de niveau. R_V_S_M en séparateurs phonétiques conforme à la convention app. Avancé.  
  _Contenu proposé :_ [FR/ATC] [CAL], confirmez homologué R_V_S_M.
[FR/Pilot] Homologué R_V_S_M, [CAL].
[FR/Pilot] R_V_S_M impossible cause..., [CAL].
[FR/ATC] [CAL], rappelez prêt à reprendre R_V_S_M.
[FR/Pilot] Prêt à reprendre R_V_S_M, [CAL].
[FR/ATC] [CAL], clairance impossible vers espace R_V_S_M, maintenez niveau [NIV].
[FR/Pilot] Je maintiens niveau [NIV], [CAL].
[EN/ATC] [CAL], confirm R_V_S_M approved.
[EN/Pilot] R_V_S_M approved, [CAL].
[EN/Pilot] Unable R_V_S_M due..., [CAL].
[EN/ATC] [CAL], report able to resume R_V_S_M.
[EN/Pilot] Ready to resume R_V_S_M, [CAL].
[EN/ATC] [CAL], unable clearance into R_V_S_M airspace, maintain level [NIV].
[EN/Pilot] Maintaining level [NIV], [CAL].  
  _Réf. manuel :_ E. MONTÉE — 3. RVSM / Expressions, lignes 3512-3548 (p.77)

### F. Croisiere

_La section Croisière de l'app couvre l'essentiel (contact CTR, changement de route/direct, changement de niveau, information de trafic, régulation) mais avec des inexactitudes de phraséologie. Le point le plus important est le collationnement du pilote sur l'information de trafic : l'app fait répondre "Roger"/"Bien compris" alors que le Manuel 10e édition impose "Je surveille"/"Looking out" (p.89). Plusieurs procédures standard du chapitre F sont absentes et constituent une base solide pour le niveau avancé (séparation à vue, acceptation/refus contrôleur, compte rendu de position, routes offset, annulation IFR en vol, clôture de plan de vol)._

#### Erreurs

- **CROISIERE-E1** (IFR, majeur) — `TRAFIC (IFR)`  
  _Problème :_ Le collationnement pilote après une information de trafic est "Roger, [CAL]" (FR et EN). La phraséologie de BASE du Manuel p.89 impose "Je surveille" / "Looking out" (l.4014/4025). La forme "Roger... je regarde/looking" n'apparaît que dans les EXEMPLES p.93 (F B X). Pour la forme de base attendue en simu, c'est "Je surveille"/"Looking out". De plus la parenthèse (dès acquisition visuelle) est VIDE dans le dump (lignes 552-553 et 556-557 : "(" puis ")" sans texte).  
  _Actuel :_ [FR/ATC] [CAL], trafic à 11 heures, 4 nautiques, gauche vers droite, Airbus heavy, 1000 pieds plus haut. / [FR/Pilot] Roger, [CAL] ( ). / [FR/Pilot] Airbus en vue, 1000 pieds plus haut, [CAL].  
  _Corrigé :_ [FR/ATC] [CAL], trafic à 11 heures, 4 nautiques, gauche vers droite, Airbus heavy/gros porteur, 1000 pieds plus haut. / [FR/Pilot] Je surveille, [CAL]. (dès acquisition visuelle) / [FR/Pilot] Airbus en vue, 1000 pieds plus haut, [CAL]. — EN: Looking out, [CAL]. / Airbus in sight, 1000 feet above, [CAL].  
  _Réf. manuel :_ F. Croisière §5 Information de trafic, Phraséologie de base p.89 (l.4011-4029) ; Exemples p.93 (l.4156-4180)

- **CROISIERE-E2** (VFR, mineur) — `TRAFIC (VFR)`  
  _Problème :_ Le collationnement pilote "Bien compris" (FR, l.115) / "Roger" (EN, l.118) avant acquisition visuelle n'est pas la forme de BASE du Manuel qui est "Je surveille"/"Looking out" (p.89). La forme "Roger... je regarde/looking" existe dans l'exemple VFR F B X p.93 (l.4159/4166) mais la réponse-type recommandée reste "Je surveille". À harmoniser avec la tâche IFR TRAFIC.  
  _Actuel :_ [FR/Pilot] Bien compris, [CAA] (et dès acquisition visuelle). / [EN/Pilot] Roger, [CAA] (et dès acquisition visuelle).  
  _Corrigé :_ [FR/Pilot] Je surveille, [CAA] (dès acquisition visuelle). / [EN/Pilot] Looking out, [CAA] (then on sighting).  
  _Réf. manuel :_ F. Croisière §5 Information de trafic, Phraséologie de base p.89 (l.4014/4025)

- **CROISIERE-E3** (IFR, mineur) — `ROUTE_CONTROLEUR`  
  _Problème :_ Faute d'orthographe dans le collationnement pilote anglais (l.536) : "Route amendement" (orthographe française) au lieu de "Route amendment". La ligne ATC (l.535) écrit correctement "route amendment".  
  _Actuel :_ [EN/ATC] [CAL], route amendment, [WPT]. / [EN/Pilot] Route amendement, [WPT], [CAL].  
  _Corrigé :_ [EN/Pilot] Route amendment, [WPT], [CAL].  
  _Réf. manuel :_ F. Croisière §2 Modification de route, p.83 (l.3803/3807 "route amendment")

- **CROISIERE-E4** (IFR, mineur) — `ROUTE_POSITIVE`  
  _Problème :_ Faute d'orthographe dans le texte anglais ATC (l.541) : "approuved" au lieu de "approved" (le Manuel écrit "direct \"ATN\" approved", p.98).  
  _Actuel :_ [EN/ATC] [CAL], direct [WPT] approuved.  
  _Corrigé :_ [EN/ATC] [CAL], direct [WPT] approved.  
  _Réf. manuel :_ F. Croisière §7 Acceptation, p.98 (l.4362 "direct ... approved")

- **CROISIERE-E5** (IFR, mineur) — `ROUTE_NEGATIVE`  
  _Problème :_ Ordre des mots incorrect dans le refus anglais (l.547). Le Manuel énonce "unable new route due flow control" et non "route amendment unable due flow control". Défaut de formatage : espace manquant après [CAL] ("[CAL],route").  
  _Actuel :_ [EN/ATC] [CAL],route amendment unable due flow control.  
  _Corrigé :_ [EN/ATC] [CAL], unable new route due flow control.  
  _Réf. manuel :_ F. Croisière §2 Modification de route, p.83 (l.3807 "unable new route due flow control")

#### Manquements

- **CROISIERE-G1** (IFR) — Compte rendu de position  
  Aucune tâche de croisière ne couvre le compte rendu de position ni les demandes/instructions associées (Rappelez ..., Omettez comptes rendus, Reprenez comptes rendus, Quelle est votre distance D_M_E). Vérifié absent du dump (les occurrences de "rappelez" concernent uniquement sol/tour/approche). Échange standard fréquent en croisière IFR et FIS.  
  _Échange proposé :_ [FR/ATC] [CAL], rappelez [WPT]. / [FR/Pilot] Je rappellerai [WPT], [CAL]. (puis au passage) [FR/Pilot] [CAL], [WPT] à [HOU], niveau [NIV], [WPT2] estimé à (minute). — [EN/ATC] [CAL], report [WPT]. / [EN/Pilot] Will report [WPT], [CAL]. / [EN/Pilot] [CAL], [WPT] time (min), level [NIV], [WPT2] estimated time (min).  
  _Réf. manuel :_ F. Croisière §4 Compte rendu de position, p.87 (l.3925-3959)

- **CROISIERE-G2** (IFR) — Séparation à vue en croisière  
  La séparation à vue en montée/descente (classe D/E, VMC, sous FL100) n'existe pas en tâche croisière IFR. L'app ne traite la séparation à vue qu'en approche à vue (TRAFIC_MVL/ACCEPTE_MVL, l.653/667). Échange demandé par le pilote, puis clairance "assurez votre séparation, restez V_M_C".  
  _Échange proposé :_ [FR/Pilot] [ARR] [NCTR], [CAL], demande séparation à vue avec Boeing 737, 10 heures, plus haut. / [FR/ATC] [CAL], je vous rappelle. (puis) [FR/ATC] [CAL], assurez votre séparation, restez V_M_C et montez niveau [NIV]. / [FR/Pilot] J'assure ma séparation, reste V_M_C et monte niveau [NIV], [CAL]. — EN: request visual separation with Boeing 737, 10 o'clock, above / I call you back / maintain own separation, maintain V_M_C and climb level [NIV] / Maintaining own separation, maintaining V_M_C and climbing level [NIV], [CAL].  
  _Réf. manuel :_ F. Croisière §6 Clairance de séparation à vue, p.94-95 (l.4249-4262)

- **CROISIERE-G3** (IFR) — Refus motivé du contrôleur (changement de niveau)  
  Le refus motivé du contrôleur n'existe que pour le changement de route (ROUTE_NEGATIVE, cause régulation, l.545). Le Manuel montre le refus d'un changement de NIVEAU avec motif trafic opposé (l.4381-4390) — échange courant, complémentaire de NIVEAU.  
  _Échange proposé :_ [FR/Pilot] [ARR] [NCTR], [CAL], demande niveau [NIV], cause turbulence. / [FR/ATC] [CAL], négatif, maintenez niveau [NIV2], trafic opposé, croisement dans 3 minutes. / [FR/Pilot] Je maintiens niveau [NIV2], [CAL]. — EN: request level [NIV] due turbulence / negative, maintain level [NIV2], opposite traffic, crossing in 3 minutes / Maintaining level [NIV2], [CAL].  
  _Réf. manuel :_ F. Croisière §7 Acceptation ou refus du contrôleur, p.98 (l.4378-4390)

- **CROISIERE-G4** (IFR) — Déroutement météo (demande de cap approuvée)  
  Demande de déviation pour évitement météo (X degrés droite pendant N nautiques) approuvée par le contrôleur : échange standard non couvert. L'app a l'évitement F_O_D en approche (GUIDAGE_RADAR, l.947) mais pas l'évitement météo en croisière avec la structure demande/approuvé. Le Manuel ne montre pas de collationnement pilote ici ; l'ajout d'un readback est conforme à la pratique standard.  
  _Échange proposé :_ [FR/Pilot] [ARR] [NCTR], [CAL], demande 30 degrés droite pendant 15 nautiques pour évitement météo. / [FR/ATC] [CAL], 30 degrés droite pendant 15 nautiques approuvé. / [FR/Pilot] 30 degrés droite pendant 15 nautiques, [CAL]. — EN: request 30 degrees right for next 15 miles to avoid weather / 30 degrees right for next 15 miles approved / 30 degrees right for next 15 miles, [CAL].  
  _Réf. manuel :_ F. Croisière §7 Acceptation, p.98 (l.4368-4375)

- **CROISIERE-G5** (les deux) — Annulation IFR en vol  
  La transformation d'un vol IFR en VFR (annulation IFR) n'est pas dans l'app. Échange standard de croisière/descente, avec attribution d'un nouveau code transpondeur et fréquence FIS (classe E/G). Vérifié absent du dump.  
  _Échange proposé :_ [FR/Pilot] [ARR] [NCTR], [CAL], annule I_F_R, heure estimée d'arrivée [DEST] [HOU]. / [FR/ATC] [CAL], I_F_R annulé à [HOU], vous êtes maintenant V_F_R avec plan de vol, estimée [DEST] à [HOU2], transpondeur [SQU], information de vol disponible sur [FREQ]. / [FR/Pilot] Transpondeur [SQU], [FREQ], [CAL], au revoir. — EN: cancel I_F_R, estimated time of arrival [DEST] [HOU] / I_F_R cancelled at [HOU], you are now V_F_R with flight plan, [DEST] estimated at [HOU2], squawk [SQU], flight information available on [FREQ] / Squawk [SQU], [FREQ], [CAL], goodbye.  
  _Réf. manuel :_ F. Croisière §11 Annulation IFR en vol, classe E/G, p.104 (l.4587-4603)

- **CROISIERE-G6** (IFR) — Assignation de route ATS (procédez / autorisé)  
  L'assignation de route ATS par "procédez [route] ..." ou "autorisé [route] ..." avec collationnement complet des points n'est pas représentée. L'app a seulement "direct [WPT]" (DIRECT) et "changement de route [WPT]" (ROUTE_CONTROLEUR). La forme "procédez ... puis ..." est un standard de base p.79.  
  _Échange proposé :_ [FR/ATC] [CAL], procédez [route] [WPT], [WPT2], puis [WPT3]. / [FR/Pilot] Je procède [route] [WPT], [WPT2], puis [WPT3], [CAL]. — EN: proceed [route] [WPT], [WPT2], then [WPT3] / Proceeding [route] [WPT], [WPT2], then [WPT3], [CAL].  
  _Réf. manuel :_ F. Croisière §1 Description d'une route ATS, p.79 (l.3626-3644 "procédez/proceed", "autorisé/cleared")

- **CROISIERE-G7** (VFR) — Clôture du plan de vol en vol  
  La clôture du plan de vol VFR pendant le vol n'est pas couverte (aucune occurrence "clôture/closing flight plan" dans le dump). Échange très court et standard, utile en simulation VFR.  
  _Échange proposé :_ [FR/Pilot] [ARR] [NCTR], [CAA], passe [WPT] et clôture plan de vol. / [FR/ATC] [CAA], plan de vol clôturé. — EN: passing [WPT], closing flight plan / flight plan closed.  
  _Réf. manuel :_ F. Croisière §12 Clôture du plan de vol pendant le vol, p.106 (l.4696-4704)

#### Propositions niveau Avancé

- **CROISIERE-A1** (IFR) — Description de route complexe (direct/route mixtes, survol obligatoire)  
  Clairance de route mêlant "[route]" et "direct" avec transition "puis/then", et cas du survol obligatoire d'un point (excluant le virage anticipé, l.3713-3728). Le pilote collationne l'intégralité des points, y compris "survol obligatoire/overflight mandatory".  
  _Contenu proposé :_ [FR/ATC] [CAL], [route] [WPT], direct [WPT2], puis [route] [AWY]. / [FR/Pilot] [WPT], direct [WPT2], puis [route] [AWY], [CAL]. — cas survol obligatoire — [FR/ATC] [CAL], [route] [AWY], [WPT2] survol obligatoire, puis [WPT3]. / [FR/Pilot] [route] [AWY], [WPT2] survol obligatoire, puis [WPT3], [CAL]. — EN: [route] [WPT], direct [WPT2], then [route] [AWY] / [WPT], direct [WPT2], then [route] [AWY], [CAL] ; [route] [AWY], [WPT2] overflight mandatory, then [WPT3] / [route] [AWY], [WPT2] overflight mandatory, then [WPT3], [CAL].  
  _Réf. manuel :_ F. Croisière §1 Phraséologie complémentaire, p.80-81 (l.3665-3728)

- **CROISIERE-A2** (IFR) — Modification de route à l'initiative du contrôle (modification de clairance / réautorisé) et changement de destination  
  Séquence "modification de clairance, rappelez prêt à copier" (l.3770) puis "réautorisé ..., cause activité militaire" (l.3781), avec collationnement des points. Inclut le changement de destination demandé par le pilote (l.3826-3844 : nouvelle destination + virage direct).  
  _Contenu proposé :_ [FR/ATC] [CAL], modification de clairance, rappelez prêt à copier. / [FR/Pilot] Prêt à copier, [CAL]. (puis) [FR/ATC] [CAL], réautorisé [WPT], [WPT2], [WPT3], cause activité militaire. / [FR/Pilot] [WPT], [WPT2], [WPT3], [CAL]. — Variante changement de destination — [FR/Pilot] [ARR] [NCTR], [CAL], demande nouvelle destination [DEST], cause demande compagnie. / [FR/ATC] [CAL], stand-by. (puis) [FR/ATC] [CAL], nouvelle destination [DEST], tournez à gauche direct [WPT], puis [WPT2]. / [FR/Pilot] Je tourne à gauche direct [WPT], puis [WPT2], [CAL]. — EN: amended clearance, report ready to copy / Ready to copy / recleared [WPT], [WPT2], [WPT3], due military activity ; request new destination [DEST] due company request / new destination [DEST], turn left direct [WPT], then [WPT2] / Turning left direct [WPT], then [WPT2], [CAL].  
  _Réf. manuel :_ F. Croisière §2 Modification de route, p.82-84 (l.3770-3844)

- **CROISIERE-A3** (IFR) — Route parallèle offset (R_N_P)  
  Route offset applicable sur segments en route en navigation de surface (R_N_P, l.3865). Le contrôleur assigne un décalage parallèle, le pilote collationne le côté et la distance ; fin d'offset par une clairance de directe ou un cap d'interception < 45° (l.3885-3888). Hors STAR/attente et hors changement de direction > 90° (l.3867).  
  _Contenu proposé :_ [FR/ATC] [CAL], tournez à droite et suivez route offset, 10 nautiques à droite de [route] [AWY]. / [FR/Pilot] Je tourne à droite et suis route offset, 10 nautiques droite de [route] [AWY], [CAL]. — EN: turn right and proceed offset, 10 miles right of [AWY] / Turning right and proceeding offset, 10 miles right of [AWY], [CAL]. (Prérequis : équipement R_N_P.)  
  _Réf. manuel :_ F. Croisière §3 Routes parallèles offset, p.85-86 (l.3897-3913)

- **CROISIERE-A4** (IFR) — Information de trafic détaillée (position, mouvement relatif, type, altitude relative)  
  Formes riches d'information de trafic : mouvement relatif (convergent/divergent, même sens/sens opposé, en dépassement, l.4083-4096), type (heavy/gros porteur, rapide, lent, non identifié, l.4115-4125), altitude relative (à travers votre niveau, plus bas en montée, l.4133-4143). Le contrôleur n'énonce jamais un niveau de vol mais une position verticale relative (l.3997-3998) ; "plus haut/plus bas" (édition 10). NB : dans l'exemple p.93 le collationnement est "Roger, [CAL], je regarde" / "Roger, [CAL], looking" (l.4159/4166), pas "je surveille".  
  _Contenu proposé :_ [FR/ATC] [CAL], trafic nord-est de votre position, 12 nautiques, de la droite vers la gauche, Airbus 380 gros porteur, 2000 pieds plus haut, en descente à travers votre niveau. / [FR/Pilot] Roger, [CAL], je regarde. (puis) [FR/Pilot] Trafic en vue, [CAL]. — Variante trafic sur route — [FR/ATC] [CAL], trafic route [WPT] [WPT2], A_T_R 72, 1000 pieds plus haut. / [FR/Pilot] Roger, [CAL]. — EN: traffic north-east of your position, 12 miles, from right to left, Airbus 380 heavy, 2000 feet above, descending through your level / Roger, [CAL], looking / traffic route [WPT] [WPT2], A_T_R 72, 1000 feet above / Roger, [CAL].  
  _Réf. manuel :_ F. Croisière §5 Information de trafic, Expressions et Exemples, p.90-93 (l.4045-4180)

- **CROISIERE-A5** (IFR) — Séparation à vue : accord de l'autre trafic, acceptation/refus  
  Cycle complet : demande pilote, interrogation du second aéronef (acceptez-vous séparation à vue, l.4253), clairance "assurez votre séparation, restez V_M_C" (l.4258) ; et variante de refus (négatif, maintenez niveau, l.4297). Transfert de responsabilité de séparation au pilote pendant toute la durée, gestion de la turbulence de sillage (l.4227-4235).  
  _Contenu proposé :_ [FR/Pilot] [ARR] [NCTR], [CAL], demande séparation à vue avec Boeing 737, 10 heures, plus haut. / [FR/ATC] [CAL], je vous rappelle. (au 2e aéronef) [FR/ATC] [CAL2], acceptez-vous séparation à vue avec trafic, 2 heures, 6 nautiques, droite vers gauche, Airbus, 1000 pieds plus bas ? / [FR/Pilot] Affirme, [CAL2]. (puis) [FR/ATC] [CAL], assurez votre séparation, restez V_M_C et montez niveau [NIV]. / [FR/Pilot] J'assure ma séparation, reste V_M_C et monte niveau [NIV], [CAL]. — Variante refus — [FR/ATC] [CAL], négatif, maintenez niveau [NIV]. — EN: request visual separation with Boeing 737, 10 o'clock, above / I call you back / do you accept visual separation with traffic, 2 o'clock, 6 miles, right to left, Airbus, 1000 feet below? / Affirm / maintain own separation, maintain V_M_C and climb level [NIV] / Maintaining own separation, maintaining V_M_C and climbing level [NIV], [CAL] ; negative, maintain level [NIV].  
  _Réf. manuel :_ F. Croisière §6 Séparation à vue, p.94-96 (l.4249-4304)

- **CROISIERE-A6** (IFR) — Début du service du contrôle en vol / changement de classe d'espace  
  Clairance initiale à un IFR en vol pénétrant en espace contrôlé (début du service du contrôle passant niveau X, montez niveau Y, route, l.4486), et information au passage classe D vers E (présence possible de VFR inconnus, l.4424).  
  _Contenu proposé :_ [FR/ATC] [CAL], début du service du contrôle passant niveau [NIV], montez niveau [NIV2], [route] [WPT], [WPT2]. / [FR/Pilot] Je monte niveau [NIV2], [WPT], [WPT2], [CAL]. — Information classe E — [FR/ATC] [CAL], espace aérien de classe E, présence possible de V_F_R inconnus. / [FR/Pilot] Roger, [CAL]. — EN: control service provided passing level [NIV], climb level [NIV2], [route] [WPT], [WPT2] / Climbing level [NIV2], [WPT], [WPT2], [CAL] ; Class E airspace, beware of unknown V_F_R traffic / Roger, [CAL].  
  _Réf. manuel :_ F. Croisière §9 Clairance initiale IFR en vol, p.101 (l.4486-4494) ; §8 classe D vers E, p.99 (l.4424-4426)

- **CROISIERE-A7** (IFR) — Clarification vocale d'un transfert CPDLC  
  Le contrôleur clarifie en phonie un dialogue CPDLC de changement de fréquence : "Ignorez message C_P_D_L_C changement de fréquence, break, contactez ..." (l.4527). Procédure avancée réservée aux aéronefs équipés.  
  _Contenu proposé :_ [FR/ATC] [CAL], ignorez message C_P_D_L_C changement de fréquence, break, contactez [NCTR] [FREQ]. / [FR/Pilot] [FREQ], [CAL]. — EN: disregard C_P_D_L_C frequency change message, break, contact [NCTR] [FREQ] / [FREQ], [CAL].  
  _Réf. manuel :_ F. Croisière §10 Communications CPDLC, p.102 (l.4527-4530)

- **CROISIERE-A8** (IFR) — Annulation IFR en classe C/D avec clairance modifiée  
  Variante avancée de l'annulation IFR : en classe C/D le contrôleur demande les intentions et délivre une clairance VFR modifiée (descendez niveau, direct point, l.4628-4638).  
  _Contenu proposé :_ [FR/Pilot] [ARR] [NCTR], [CAL], annule I_F_R, heure estimée d'arrivée [DEST] [HOU]. / [FR/ATC] [CAL], I_F_R annulé à [HOU], vous êtes maintenant V_F_R avec plan de vol, estimée [DEST] à [HOU2], transpondeur [SQU], quelles sont vos intentions ? / [FR/Pilot] Demande niveau [NIV], direct [WPT], [CAL]. / [FR/ATC] [CAL], descendez niveau [NIV], direct [WPT]. / [FR/Pilot] Je descends niveau [NIV], direct [WPT], [CAL]. — EN: cancel I_F_R, ETA [DEST] [HOU] / I_F_R cancelled at [HOU], you are now V_F_R with flight plan, [DEST] estimated at [HOU2], squawk [SQU], advise intentions / Request level [NIV], direct [WPT] / descend level [NIV], direct [WPT] / Descending level [NIV], direct [WPT], [CAL].  
  _Réf. manuel :_ F. Croisière §11 Annulation IFR en vol, classe C ou D, p.105 (l.4628-4652)

### G+H. Descente & Attentes

_La section G+H (Descente & Attentes) est globalement conforme à l'édition 10 : les collationnements pilote emploient bien le verbe d'action ("je descends") et les libellés de base (descente, via STAR, attente) sont exacts. Quelques défauts subsistent : le collationnement pilote de la descente à l'initiative du pilote comporte "au niveau"/"le niveau" absents du manuel, l'interrogation de vitesse utilise "quelle est votre vitesse / say speed" au lieu de "indiquez votre vitesse / report speed", et ATTENTE_PUBLIEE mélange niveau et pieds. Plusieurs échanges standard riches manquent (clairance STAR au 1er contact avec "autorisé arrivée", expédiez la descente, annulation de restrictions, retardement en route, IFR vers EANC/AFIS), et le niveau avancé (vide) peut être nourri par les vitesses spécifiques, l'attente non publiée détaillée et le passage en espace non contrôlé._

#### Erreurs

- **DESC-E1** (IFR, majeur) — `DESCENTE_DELAI`  
  _Problème :_ Verifie. JSON l.569 : '[CAL], libere le niveau XXX en descente au niveau [NIV]'. Le manuel (l.4787) dit 'Paris, Rapidair 3245, libere niveau 310 en descente niveau 250' : pas de 'le' ni de 'au'. De plus 'XXX' est un placeholder brut non balise (niveau quitte). La version EN (l.573 'leaving level XXX, descending level [NIV]') correspond au manuel l.4798 hormis le meme XXX.  
  _Actuel :_ [FR/Pilot] [CAL], libere le niveau XXX en descente au niveau [NIV].  
  _Corrigé :_ [FR/Pilot] [ARR], [CAL], libere niveau [NIVQUITTE] en descente niveau [NIV]. (retirer 'le' et 'au' ; remplacer XXX par une balise de niveau quitte ; l'annonce est adressee a l'organisme d'ou [ARR] optionnel comme 'Paris,...' dans le manuel). Corriger aussi 'XXX' dans la version EN.  
  _Réf. manuel :_ G.1 Clairance de descente, phraseologie de base (descente a l'initiative du pilote), p.108 (FR l.4787 ; EN l.4798)

- **DESC-E2** (IFR, majeur) — `VITESSE`  
  _Problème :_ Verifie. JSON l.589 'quelle est votre vitesse ?' et l.593 'say speed?'. Le manuel emploie 'Rapidair 3245, indiquez votre vitesse.' (l.5185) et 'report speed' (l.5195). Formes du JSON non normalisees edition 10.  
  _Actuel :_ [FR/ATC] [CAL], quelle est votre vitesse ? / [EN/ATC] [CAL], say speed?  
  _Corrigé :_ [FR/ATC] [CAL], indiquez votre vitesse. / [EN/ATC] [CAL], report speed.  
  _Réf. manuel :_ G.3 Utilisation des vitesses, phraseologie complementaire, p.119 (FR l.5185 ; EN l.5195)

- **DESC-E3** (IFR, mineur) — `REDUCTION_VITESSE`  
  _Problème :_ Verifie, avec correction de reference. Le manuel donne 'reduisez vitesse minimale en lisse' (l.5147) et le collationnement pilote 'Je reduis 220 noeuds' (l.5149, valeur ferme) / EN 'Reducing 220 knots' (l.5155). Le JSON ecrit 'mini en lisse' (l.599, abrege au lieu de 'minimale') et '(220) noeuds' entre parentheses (l.600) comme si la valeur etait optionnelle. La reference p.122 l.5312 du constat initial est imprecise : la source exacte est p.118 l.5147-5155.  
  _Actuel :_ [FR/ATC] [CAL], reduisez vitesse mini en lisse. / [FR/Pilot] Je reduis (220) noeuds, [CAL].  
  _Corrigé :_ [FR/ATC] [CAL], reduisez vitesse minimale en lisse. / [FR/Pilot] Je reduis 220 noeuds, [CAL]. (EN : Reducing 220 knots)  
  _Réf. manuel :_ G.3 Utilisation des vitesses, phraseologie complementaire, p.118 (FR l.5147, collationnement l.5149 ; EN l.5153/5155)

- **DESC-E4** (IFR, majeur) — `ATTENTE_PUBLIEE`  
  _Problème :_ Verifie. JSON l.627 '[CAL], descendez [NIV] pieds, Q_N_H [QNH], HAP 32' : la balise [NIV] (niveau de vol, p.ex. 110) est suivie de 'pieds' et d'un QNH, ce qui est incoherent. Le manuel donne soit une descente en niveau de vol sans QNH ('descendez niveau 110, attendez a TALAR, H_A_P 35', l.5670), soit une descente en altitude 'X pieds Q_N_H' (cf. G.2 l.5010) avec une valeur d'altitude, pas un niveau de vol. Coupler [NIV] et 'pieds/QNH' melange les deux unites.  
  _Actuel :_ [FR/ATC] [CAL], descendez [NIV] pieds, Q_N_H [QNH], HAP 32. / [FR/Pilot] Je descends [NIV] pieds, Q_N_H [QNH], HAP 32, [CAL].  
  _Corrigé :_ Soit conserver le niveau de vol conformement au manuel IAF (l.5670) : [CAL], descendez niveau [NIV], attendez a [STA], H_A_P 32. — soit, pour une descente en altitude, utiliser une balise altitude dediee : [CAL], descendez [ALT] pieds Q_N_H [QNH], H_A_P 32.  
  _Réf. manuel :_ H.2 Attente, phraseologie de base, attente a l'arrivee a IAF, p.129 (l.5670-5677)

- **DESC-E5** (IFR, mineur) — `ATTENTE_PUBLIEE`  
  _Problème :_ Verifie. Le JSON ecrit 'HAP 32' (l.627-628) alors que le manuel epelle H_A_P : 'Nouvelle H_A_P 55' (l.5571), 'H_A_P MELUN' (l.5658), 'H_A_P 35' (l.5670). La forme phonetique H_A_P est celle attendue dans l'app (coherente avec Q_N_H, R_N_P). En EN 'expected approach time' est correct ; le JSON utilise deja 'estimated approach time' (l.629) qui devrait etre 'expected approach time' conformement au manuel.  
  _Actuel :_ [FR/ATC] ..., HAP 32. / [FR/Pilot] ..., HAP 32, [CAL].  
  _Corrigé :_ Ecrire H_A_P 32 (FR) ; en EN utiliser 'expected approach time 32' (le JSON dit 'estimated', a corriger en 'expected').  
  _Réf. manuel :_ H.1 Generalites, expressions p.127 (l.5571-5573) ; H.2 p.129 (l.5658, 5670)

#### Manquements

- **DESC-G1** (IFR) — Clairance d'arrivee STAR au premier contact  
  Verifie. Le conteneur DESCENTE (l.942) a bien le premier contact pilote 'niveau [NIV], direct [WPT]' mais aucune reponse ATC 'direct [WPT], puis autorise arrivee [STA]' ; APPROCHE_STAR (l.577) ne couvre que 'descendez via STAR niveau [NIV]'. L'entree standard dans une STAR apres un direct ('autorise arrivee BIBAX 7 W' / 'cleared BIBAX 7 W arrival', manuel l.4892/4899) manque. Echange tres frequent en simu IFR d'arrivee.  
  _Échange proposé :_ [FR/Pilot] [ARR], [POL], [CAL], niveau [NIV], direct [WPT].
[FR/ATC] [CAL], [POL], direct [WPT], puis autorise arrivee [STA].
[FR/Pilot] Direct [WPT], puis arrivee [STA], [CAL].
[EN/Pilot] [ARR], [POL], [CAL], level [NIV], direct [WPT].
[EN/ATC] [CAL], [POL], direct [WPT], then cleared [STA] arrival.
[EN/Pilot] Direct [WPT], then [STA] arrival, [CAL].  
  _Réf. manuel :_ G.2 Clairance de route incluant une STAR, phraseologie de base, p.111 (l.4890-4901)

- **DESC-G2** (IFR) — Descente acceleree a travers un niveau  
  Verifie. JSON couvre DESCENTE_IMMEDIATE (l.561) mais pas la descente expediee a travers un niveau intermediaire ('expediez la descente a travers niveau 70' / 'expedite descent until passing level 70', manuel l.4825/4834), courante en approche pour franchir vite un niveau.  
  _Échange proposé :_ [FR/ATC] [CAL], descendez niveau [NIV], expediez la descente a travers niveau [NIVINT].
[FR/Pilot] Je descends niveau [NIV] et expedie la descente a travers niveau [NIVINT], [CAL].
[EN/ATC] [CAL], descend level [NIV], expedite descent until passing level [NIVINT].
[EN/Pilot] Descending level [NIV], expediting descent until passing level [NIVINT], [CAL].  
  _Réf. manuel :_ G.1 phraseologie complementaire, p.109 (l.4825-4837)

- **DESC-G3** (IFR) — Levee des restrictions de vitesse (vitesse libre)  
  Verifie. Le JSON propose la reduction (VITESSE l.591, REDUCTION_VITESSE l.599) mais pas la levee 'vitesse libre / no speed restrictions' (manuel l.5327-5328, exemple l.5340-5341 / 5348-5349), qui clot naturellement une sequence de regulation de vitesse. Echange standard et bref.  
  _Échange proposé :_ [FR/ATC] [CAL], reduisez vitesse [VIT] noeuds pour sequencement.
[FR/Pilot] Je reduis vitesse [VIT] noeuds, [CAL].
[FR/ATC] [CAL], vitesse libre.
[FR/Pilot] Vitesse libre, [CAL].
[EN/ATC] [CAL], reduce speed [VIT] knots for sequencing.
[EN/Pilot] Reducing speed [VIT] knots, [CAL].
[EN/ATC] [CAL], no speed restrictions.
[EN/Pilot] No speed restrictions, [CAL].  
  _Réf. manuel :_ G.3 Utilisation des vitesses, expressions p.122 (l.5327-5328) et exemple (l.5337-5349)

- **DESC-G4** (IFR) — Sortie d'attente (clairance de quitter le repere)  
  Verifie. ATTENTE_PUBLIEE (l.622-630) s'arrete a l'entree en attente. Le manuel donne la suite standard : instruction de quitter le repere a une heure donnee avec le point suivant ('quittez TANKO a 1055, PAPAS ensuite', l.5644 / 'depart TANKO at 1055, PAPAS next', l.5652). Indispensable pour boucler une sequence d'attente.  
  _Échange proposé :_ [FR/ATC] [CAL], autorise jusqu'a [STA], attendez comme publie niveau [NIV], cause regulation, informations ulterieures a [HOU].
[FR/Pilot] J'attends a [STA], niveau [NIV], [CAL].
[FR/ATC] [CAL], quittez [STA] a [HOU], [WPT] ensuite.
[FR/Pilot] Je quitte [STA] a [HOU], [WPT] ensuite, [CAL].
[EN/ATC] [CAL], cleared to [STA], hold as published at level [NIV], due regulation, further information at [HOU].
[EN/Pilot] Hold at [STA] level [NIV], [CAL].
[EN/ATC] [CAL], depart [STA] at [HOU], [WPT] next.
[EN/Pilot] Departing [STA] at [HOU], [WPT] next, [CAL].  
  _Réf. manuel :_ H.2 Attente, phraseologie de base, attente en route imprevue, p.129 (l.5639-5653)

- **DESC-G5** (IFR) — Descente vers espace non controle / fin de service de controle  
  Verifie. Le JSON n'a qu'un TRANSFERT_UNICOM generique (auto-information, l.496-500), pas la procedure IFR standard de descente vers le plus bas niveau utilisable avec 'espace aerien non controle en dessous, rappelez liberant niveau X' (manuel l.5412/5427) puis fin de service et transfert vers Information (l.5419-5422 / 5435-5438). Echange type de fin d'arrivee IFR sur aerodrome AFIS.  
  _Échange proposé :_ [FR/ATC] [CAL], descendez niveau [NIV], espace aerien non controle en dessous, rappelez liberant niveau [NIV].
[FR/Pilot] Je descends niveau [NIV], [CAL].
[FR/Pilot] [ARR], [CAL], libere niveau [NIV] en descente.
[FR/ATC] [CAL], service du controle termine, contactez [ARR] Information [FREQ].
[FR/Pilot] [ARR] [FREQ], [CAL].
[EN/ATC] [CAL], descend level [NIV], you are going to leave controlled airspace below, report leaving level [NIV].
[EN/Pilot] Descending level [NIV], [CAL].
[EN/Pilot] [ARR], [CAL], leaving level [NIV] descending.
[EN/ATC] [CAL], control service terminated, contact [ARR] Information [FREQ].
[EN/Pilot] [ARR] [FREQ], [CAL].  
  _Réf. manuel :_ G.4 Passage d'un vol IFR controle vers un aerodrome AFIS, phraseologie de base, p.124 (l.5412-5438)

- **DESC-G6** (IFR) — Rejointe de STAR et descente en altitude QNH  
  Verifie. APPROCHE_DIRECT (l.583) couvre 'procedez direct [WPT], descendez via [STA] niveau [NIV]'. Manque la variante 'rejoignez STAR et descendez via STAR X pieds Q_N_H' (manuel l.5009-5013 / 5017-5021), qui fait la transition niveau vers altitude en fin de STAR sous le niveau de transition.  
  _Échange proposé :_ [FR/ATC] [CAL], procedez direct [WPT], rejoignez [STA] et descendez via [STA] [ALT] pieds Q_N_H [QNH].
[FR/Pilot] Direct [WPT], je rejoins et descends via [STA] [ALT] pieds Q_N_H [QNH], [CAL].
[EN/ATC] [CAL], proceed direct [WPT], rejoin [STA] and descend via [STA] [ALT] feet Q_N_H [QNH].
[EN/Pilot] Direct [WPT], rejoining and descending via [STA] [ALT] feet Q_N_H [QNH], [CAL].  
  _Réf. manuel :_ G.2 phraseologie complementaire, direct sur STAR avec rejointe, p.114 (l.5009-5021)

#### Propositions niveau Avancé

- **DESC-A1** (IFR) — Interrogation puis modification de vitesse / mach  
  Verifie. Sequence avancee ou le controleur interroge la vitesse (ou le mach) puis impose une variation. Introduit les nombres de mach ('mach decimale 76', l.5208) et l'incrementation ('augmentez mach decimale 78', l.5210). Non couvert en intermediaire (VITESSE l.588 n'a que reduction pour sequencement). NB : la partie 'indiquez votre vitesse' recoupe le correctif DESC-E2 ; c'est la variante mach + augmentation qui est proprement avancee.  
  _Contenu proposé :_ [FR/ATC] [CAL], indiquez votre vitesse.
[FR/Pilot] [VIT] noeuds, [CAL].
[FR/ATC] [CAL], reduisez vitesse [VIT2] noeuds pour sequencement.
[FR/Pilot] Je reduis [VIT2] noeuds, [CAL].
[EN/ATC] [CAL], report speed.
[EN/Pilot] [VIT] knots, [CAL].
[EN/ATC] [CAL], reduce speed [VIT2] knots for sequencing.
[EN/Pilot] Reducing [VIT2] knots, [CAL].
(Variante mach : [FR/ATC] [CAL], indiquez votre nombre de mach. [FR/Pilot] Mach decimale 76, [CAL]. [FR/ATC] [CAL], augmentez mach decimale 78 pour sequencement. [FR/Pilot] J'augmente mach decimale 78, [CAL].)  
  _Réf. manuel :_ G.3 Utilisation des vitesses, phraseologie complementaire, p.119 (l.5185-5222)

- **DESC-A2** (IFR) — Vitesse avec borne et avec limite d'altitude/position  
  Verifie. Contrainte de vitesse bornee ('270 noeuds maximum / or less' l.5237/5243 ; '270 noeuds minimum / or greater' l.5250/5257) et vitesse maintenue jusqu'a un niveau ('maintenez 300 noeuds jusqu'au niveau 120' l.5275) ou un point ('maintenez 280 noeuds jusqu'a SAU' l.5291). Combine descente et gestion fine de vitesse.  
  _Contenu proposé :_ [FR/ATC] [CAL], descendez niveau [NIV], vitesse [VIT] noeuds maximum.
[FR/Pilot] Je descends niveau [NIV], vitesse [VIT] noeuds maximum, [CAL].
[EN/ATC] [CAL], descend level [NIV], speed [VIT] knots or less.
[EN/Pilot] Descending level [NIV], speed [VIT] knots or less, [CAL].
(puis) [FR/ATC] [CAL], descendez niveau [NIV], maintenez [VIT] noeuds jusqu'au niveau [NIVINT].
[FR/Pilot] Je descends niveau [NIV] et maintiens [VIT] noeuds jusqu'au niveau [NIVINT], [CAL].
[EN/ATC] [CAL], descend level [NIV], maintain [VIT] knots until passing level [NIVINT].
[EN/Pilot] Descending level [NIV], maintaining [VIT] knots until passing level [NIVINT], [CAL].  
  _Réf. manuel :_ G.3 phraseologie complementaire, p.120-121 (l.5237-5300)

- **DESC-A3** (IFR) — Descente via STAR avec annulation de restrictions  
  Verifie. Gestion des contraintes de STAR : lever les restrictions de niveau ('annulez restrictions de niveau', l.5043), lever une contrainte de vitesse a un point ('annulez restrictions de vitesse a KOLIV', l.5053), ou descendre sans restriction ('descendez sans restriction niveau 80', l.5062). Notions de profil publie, adaptees a l'avance.  
  _Contenu proposé :_ [FR/ATC] [CAL], descendez via [STA] niveau [NIV], annulez restrictions de niveau.
[FR/Pilot] Je descends via [STA] niveau [NIV], annule restrictions de niveau, [CAL].
[EN/ATC] [CAL], descend via [STA] level [NIV], cancel level restrictions.
[EN/Pilot] Descending via [STA] level [NIV], cancel level restrictions, [CAL].
(variantes : 'annulez restrictions de vitesse a [WPT] / cancel speed restrictions at [WPT]' ; 'descendez sans restriction niveau [NIV] / descend level [NIV] unrestricted')  
  _Réf. manuel :_ G.2 phraseologie complementaire, annulation de restrictions, p.115 (l.5043-5063)

- **DESC-A4** (IFR) — Ecart de trajectoire pour sequencement puis rejointe STAR  
  Verifie. Le controleur ecarte l'avion de la STAR pour sequencement ('tournez a gauche cap 170 cause trafic, descendez niveau 80, prevoyez de rejoindre STAR', l.4991-4992). Introduit la gestion des contraintes amont annulees / aval maintenues au retour sur la STAR.  
  _Contenu proposé :_ [FR/ATC] [CAL], tournez a gauche cap [CAP] cause trafic, descendez niveau [NIV], prevoyez de rejoindre [STA].
[FR/Pilot] Je tourne a gauche cap [CAP], descends niveau [NIV] et prevois de rejoindre [STA], [CAL].
[EN/ATC] [CAL], turn left heading [CAP] due traffic, descend level [NIV], expect to rejoin [STA].
[EN/Pilot] Turning left heading [CAP], descending level [NIV], expecting to rejoin [STA], [CAL].  
  _Réf. manuel :_ G.2 phraseologie complementaire, ecart puis rejointe STAR, p.113-114 (l.4991-5002)

- **DESC-A5** (IFR) — Retardement en route (reduction pour passer un point, 360, attente non publiee)  
  Verifie. Techniques de retardement sans procedure publiee : reduction de vitesse pour passer un point a/apres une heure avec question prealable 'pouvez-vous / advise able to' (l.5755-5767), virage de 360 pour retardement (l.5771-5776), et attente parametree sur un point avec sens et temps d'eloignement (l.5780-5789).  
  _Contenu proposé :_ [FR/ATC] [CAL], pouvez-vous reduire la vitesse pour passer [WPT] a [HOU] ou apres.
[FR/Pilot] Affirme, [CAL].
[FR/ATC] [CAL], reduisez la vitesse pour passer [WPT] a [HOU] ou apres.
[FR/Pilot] Je reduis pour passer [WPT] a [HOU] ou apres, [CAL].
[EN/ATC] [CAL], advise able to reduce speed to cross [WPT] at [HOU] or later.
[EN/Pilot] Affirm, [CAL].
[EN/ATC] [CAL], reduce speed to cross [WPT] at [HOU] or later.
[EN/Pilot] Reducing to cross [WPT] at [HOU] or later, [CAL].
(variantes : [FR/ATC] [CAL], faites un 360 a gauche pour retardement. [FR/Pilot] Je fais un 360 a gauche, [CAL]. | [EN/ATC] [CAL], make a 360 by the left for delaying action. [EN/Pilot] Making a 360 by the left, [CAL].)  
  _Réf. manuel :_ H.3 Retardement en route hors attente definie, phraseologie de base, p.132 (l.5755-5789)

- **DESC-A6** (IFR) — Demande et delivrance d'instructions d'attente completes  
  Verifie, avec reserve d'overlap. Le pilote demande les instructions ('Demande instructions d'attente / Request holding instructions', l.5688-5689) puis le controleur delivre tous les parametres, dont l'eloignement radial ('eloignement 328'), le sens des virages, le rapprochement, le temps et la vitesse maximale (l.5694-5709). Plus riche que ATTENTE_PARAMETRES intermediaire (l.633) qui couvre deja rapprochement/virages/eloignement/vitesse ; la valeur ajoutee avancee est la demande pilote initiale et l'eloignement radial.  
  _Contenu proposé :_ [FR/Pilot] Demande instructions d'attente, [CAL].
[FR/ATC] [CAL], attendez a [STA], niveau [NIV], eloignement [CAP], virages a gauche, rapprochement [CAP2] degres, eloignement 1 minute, vitesse maximale [VIT] noeuds.
[FR/Pilot] J'attends a [STA], niveau [NIV], rapprochement [CAP2] degres, virages a gauche, eloignement 1 minute, vitesse [VIT] noeuds, [CAL].
[EN/Pilot] Request holding instructions, [CAL].
[EN/ATC] [CAL], hold at [STA], level [NIV], outbound [CAP], left-hand pattern, inbound track [CAP2] degrees, time 1 minute, maximum speed [VIT] knots.
[EN/Pilot] Holding at [STA], level [NIV], inbound track [CAP2] degrees, left-hand pattern, outbound time 1 minute, speed [VIT] knots, [CAL].  
  _Réf. manuel :_ H.2 Attente, phraseologie complementaire, instructions d'attente detaillees, p.130 (l.5688-5709)

### I. Approche

_La section Approche du JSON couvre correctement l'ossature IFR débutant/intermédiaire (approche ILS autorisée, VPT, approche à vue sur demande/proposition avec info trafic, guidage radar, transfert tour). Les libellés de collationnement pilote sont conformes à l'édition 10 (le pilote collationne bien "autorisé approche / cleared approach", qui n'est PAS une expression réservée comme "autorisé décollage/atterrissage"). Les principales lacunes portent sur la clairance d'approche RNP (section 5 entière, absente), l'approche directe (straight-in), la MVL circling (seule la VPT est présente) et les procédures d'échec d'approche — matière idéale pour alimenter le niveau avancé aujourd'hui vide. Quelques coquilles anglaises et un numéro de piste manquant dans GUIDAGE_RADAR._

#### Erreurs

- **APP-E1** (IFR, mineur) — `GUIDAGE_RADAR`  
  _Problème :_ Coquille anglaise: 'maintening' n'existe pas (devrait être 'maintaining'). De plus le pilote EN termine par 'vectoring I_L_S runway,' sans numéro de piste alors que le côté FR (l.949) précise 'piste [RWY]' — la version anglaise perd la piste. Vérifié dans le JSON l.950.  
  _Actuel :_ [EN/Pilot] Approach cancelled, maintening [NIV], expecting vectoring I_L_S runway, [CAL].  
  _Corrigé :_ [EN/Pilot] Approach cancelled, maintaining [NIV], expecting vectoring I_L_S runway [RWY], [CAL].  
  _Réf. manuel :_ 5.I Approche (guidage/annulation) — coquille EN et parité FR/EN, cf. p.144 l.6273-6277 pour la forme 'vectoring ... runway 08 right'

- **APP-E2** (IFR, mineur) — `TRAFIC_MVL`  
  _Problème :_ Confirmé: la tâche TRAFIC_MVL enchaîne 'avez-vous visuel sur trafic précédent ?' qui correspond au cas 'sur demande du pilote' du manuel (l.6093). Pour ce cas le manuel emploie 'assurez votre séparation avec Fokker 70 vous précédant' (l.6096) / 'maintain own separation from preceding Fokker 70' (l.6104). Le JSON écrit 'devant vous' (l.648), tournure que le manuel réserve au cas 'sur proposition du contrôleur / derrière Airbus 320' (l.6112). Le côté EN du JSON (l.653) dit déjà correctement 'from preceding Fokker 70' — seule la version FR est fautive, ce qui confirme l'incohérence.  
  _Actuel :_ [FR/ATC] [CAL], autorisé approche à vue piste [RWY], assurez votre séparation avec (Fokker 70) devant vous.  
  _Corrigé :_ [FR/ATC] [CAL], autorisé approche à vue piste [RWY], assurez votre séparation avec (Fokker 70) vous précédant.  
  _Réf. manuel :_ 5.I.4 Clairance d'approche à vue — approches successives, sur demande du pilote, p.140 l.6095-6096 (FR) et l.6103-6104 (EN)

- **APP-E3** (IFR, mineur) — `ACCEPTE_MVL_TRAFIC`  
  _Problème :_ Confirmé: pour le cas 'sur proposition du contrôleur', le manuel fait collationner au pilote la mention du trafic: 'Autorisé approche à vue piste 10 derrière Airbus 320' (l.6113) / 'Cleared visual approach runway 10 behind Airbus 320' (l.6122). Le JSON réduit le collationnement pilote à 'Autorisé approche à vue piste [RWY], [CAL].' (l.665) sans 'derrière (A 320)'. Note: le 'devant vous' de l'ATC dans cette tâche (l.664) est en revanche correct pour ce cas et ne doit PAS être modifié.  
  _Actuel :_ [FR/Pilot] Autorisé approche à vue piste [RWY], [CAL].  
  _Corrigé :_ [FR/Pilot] Autorisé approche à vue piste [RWY] derrière (Airbus 320), [CAL].  
  _Réf. manuel :_ 5.I.4 — approches à vue successives, sur proposition du contrôleur, p.140 l.6113 (FR collationnement pilote) et l.6122 (EN)

- **APP-E4** (IFR, mineur) — `TRAFIC_MVL`  
  _Problème :_ Constat manifeste manqué par le premier examinateur. Le JSON l.651 écrit une question anglaise à l'ordre des mots non standard: 'have you visual contact on preceding traffic ?'. Le manuel édition 10 (l.6101) donne 'do you have visual contact on preceding traffic?'. À aligner sur le manuel.  
  _Actuel :_ [EN/ATC] [CAL], have you visual contact on preceding traffic ?  
  _Corrigé :_ [EN/ATC] [CAL], do you have visual contact on preceding traffic ?  
  _Réf. manuel :_ 5.I.4 — approches successives, sur demande du pilote, p.140 l.6101 (EN)

#### Manquements

- **APP-G1** (IFR) — Clairance approche RNP simple (demande/autorisé RNP RWY)  
  Vérifié: aucune tâche d'approche R_N_P dans le JSON (grep RNP négatif dans la section approche). La section 5 (approche RNP), cœur de l'approche PBN moderne, est absente. Manque l'échange de base demande/clairance RNP.  
  _Échange proposé :_ [FR/Pilot] [CAL], demande approche R_N_P piste [RWY].
[FR/ATC] [CAL], autorisé approche R_N_P piste [RWY].
[EN/Pilot] [CAL], request R_N_P approach runway [RWY].
[EN/ATC] [CAL], cleared R_N_P approach runway [RWY].  
  _Réf. manuel :_ 5.I.5 Clairance d'approche RNP — Phraséologie de base, p.144 l.6242-6250

- **APP-G2** (IFR) — Approche directe (straight-in)  
  Vérifié dans le manuel: 'Demande approche directe / Request straight-in approach' et 'Autorisé approche directe / Cleared straight-in approach' figurent parmi les expressions de base des Généralités. Aucun équivalent dans le JSON. Échange standard simple, absent.  
  _Échange proposé :_ [FR/Pilot] [CAL], demande approche directe.
[FR/ATC] [CAL], autorisé approche directe.
[EN/Pilot] [CAL], request straight-in approach.
[EN/ATC] [CAL], cleared straight-in approach.  
  _Réf. manuel :_ 5.I.1 Généralités — Expressions, p.133 l.5808-5812

- **APP-G3** (IFR) — Approche indirecte MVL (circling) suivie de 'rappelez à l'ouverture / report breaking'  
  Vérifié: le JSON ne contient que la VPT (APPROCHE_VPT, l.956). La MVL classique (circling to runway) avec le collationnement puis 'rappelez à l'ouverture' (FR) / 'report breaking' (EN) est un échange standard distinct, absent. L'asymétrie FR 'ouverture' / EN 'breaking' est bien celle du manuel.  
  _Échange proposé :_ [FR/ATC] [CAL], autorisé approche I_L_S piste (contre-QFU), suivie d'une M_V_L piste [RWY].
[FR/Pilot] Autorisé approche I_L_S piste (contre-QFU) suivie d'une M_V_L piste [RWY], [CAL].
[FR/ATC] [CAL], rappelez à l'ouverture.
[FR/Pilot] Je rappelle à l'ouverture, [CAL].
[EN/ATC] [CAL], cleared I_L_S approach runway (contre-QFU), followed by circling to runway [RWY].
[EN/Pilot] Cleared I_L_S approach runway (contre-QFU) followed by circling to runway [RWY], [CAL].
[EN/ATC] [CAL], report breaking.
[EN/Pilot] Reporting breaking, [CAL].  
  _Réf. manuel :_ 5.I.2 Approche indirecte MVL — Phraséologie de base, p.135 l.5883-5903

- **APP-G4** (IFR) — Approche impossible, procédure de substitution en vigueur  
  Vérifié: l'échange 'approche I_L_S piste 23 impossible cause panne localizer, approche V_O_R piste 23 en vigueur' + collationnement pilote 'approche V_O_R piste 23 en vigueur' est un standard des Généralités. Absent du JSON (le seul cas d'annulation présent est GUIDAGE_RADAR cause F_O_D, l.947, qui est un cas différent).  
  _Échange proposé :_ [FR/ATC] [CAL], approche I_L_S piste [RWY] impossible cause panne localizer, approche V_O_R piste [RWY] en vigueur.
[FR/Pilot] Approche V_O_R piste [RWY] en vigueur, [CAL].
[EN/ATC] [CAL], I_L_S approach runway [RWY] not available due localizer failure, V_O_R approach runway [RWY] in use.
[EN/Pilot] V_O_R approach runway [RWY] in use, [CAL].  
  _Réf. manuel :_ 5.I.1 Généralités — Exemple, p.133 l.5822-5839

- **APP-G5** (IFR) — Attention turbulence de sillage  
  Vérifié: 'attention turbulence de sillage / caution wake turbulence' avec réponse pilote 'Roger' est un complément standard de la clairance d'approche à vue, absent du JSON. Correction du constat: le manuel donne bien la réponse pilote 'Roger' EN ET FR (l.6138 'Roger, Rapidair 3245'), et non 'Reçu' — le suggested a été corrigé en 'Roger'.  
  _Échange proposé :_ [FR/ATC] [CAL], attention turbulence de sillage.
[FR/Pilot] Roger, [CAL].
[EN/ATC] [CAL], caution wake turbulence.
[EN/Pilot] Roger, [CAL].  
  _Réf. manuel :_ 5.I.4 Clairance d'approche à vue — Phraséologie complémentaire, p.141 l.6136-6144

- **APP-G6** (IFR) — Familiarité procédure et rappel virage conventionnel  
  Vérifié dans le manuel: 'Connaissez-vous la procédure d'approche I_L_S piste 23 ? / Are you familiar with I_L_S runway 23 approach procedure?' et 'Rappelez commençant virage conventionnel / Report commencing procedure turn' sont des expressions standard des Généralités, absentes du JSON. Constat le plus faible du lot (usage relativement niche) mais sourcé et standard; la réponse pilote 'Affirme/Affirm' est une extrapolation raisonnable (non montrée par le manuel).  
  _Échange proposé :_ [FR/ATC] [CAL], connaissez-vous la procédure d'approche I_L_S piste [RWY] ?
[FR/Pilot] Affirme, [CAL].
[EN/ATC] [CAL], are you familiar with I_L_S runway [RWY] approach procedure ?
[EN/Pilot] Affirm, [CAL].  
  _Réf. manuel :_ 5.I.1 Généralités — Expressions, p.133 l.5814-5821

#### Propositions niveau Avancé

- **APP-A1** (IFR) — Guidage radar suivi d'approche finale RNP avec interception d'axe  
  Vérifié conforme au manuel: 'quittez BALOD cap 030, guidage approche R_N_P piste 08 droite' puis 'tournez à droite cap 060, descendez 4 000 pieds Q_N_H 1026, pour intercepter axe d'approche finale R_N_P piste 08 droite, rappelez établi' puis 'autorisé approche R_N_P piste 08 droite'. Emploie la formulation édition 10 'intercepter axe d'approche finale' (to intercept final approach course). Les collationnements pilote ajoutés sont une extrapolation raisonnable pour la simu (non montrés par le manuel). Contenu avancé multi-étapes idéal.  
  _Contenu proposé :_ [FR/Pilot] [CAL], demande approche R_N_P piste [RWY].
[FR/ATC] [CAL], quittez (BALOD) cap 030, guidage approche R_N_P piste [RWY].
[FR/ATC] [CAL], tournez à droite cap 060, descendez 4_0_0_0 pieds Q_N_H [QNH], pour intercepter axe d'approche finale R_N_P piste [RWY], rappelez établi.
[FR/Pilot] Je tourne à droite cap 060, je descends 4_0_0_0 pieds Q_N_H [QNH] pour intercepter axe d'approche finale R_N_P piste [RWY], je rappelle établi, [CAL].
[FR/ATC] [CAL], autorisé approche R_N_P piste [RWY].
[FR/Pilot] Autorisé approche R_N_P piste [RWY], [CAL].
[EN/Pilot] [CAL], request R_N_P approach runway [RWY].
[EN/ATC] [CAL], leave (BALOD) heading 030, vectoring R_N_P approach runway [RWY].
[EN/ATC] [CAL], turn right heading 060, descend 4_0_0_0 feet Q_N_H [QNH], to intercept R_N_P final approach course runway [RWY], report established.
[EN/Pilot] Turning right heading 060, descending 4_0_0_0 feet Q_N_H [QNH] to intercept R_N_P final approach course runway [RWY], reporting established, [CAL].
[EN/ATC] [CAL], cleared R_N_P approach runway [RWY].
[EN/Pilot] Cleared R_N_P approach runway [RWY], [CAL].  
  _Réf. manuel :_ 5.I.5 Clairance d'approche RNP — Phraséologie de base (guidage), p.144 l.6259-6280

- **APP-A2** (IFR) — Arrivée initiale/intermédiaire RNAV1/RNP1 identifiée (ODILO 1A) suivie d'interception RNP finale  
  Vérifié conforme: 'autorisé ODILO 1A pour approche R_N_P piste 06' / 'cleared ODILO 1A then R_N_P runway 06', puis 'interceptez approche R_N_P piste 06, rappelez établi', puis 'autorisé approche R_N_P piste 06'. Note: le manuel titre l'exemple 'ODRAN 1A' (l.6290) mais le corps utilise 'ODILO 1A' (l.6297) — l'usage 'ODILO' du constat suit les lignes de phraséologie réelles. Illustre le nommage des transitions PBN identifiées.  
  _Contenu proposé :_ [FR/Pilot] [CAL], demande une approche R_N_P piste [RWY].
[FR/ATC] [CAL], autorisé (ODILO 1A) pour approche R_N_P piste [RWY].
[FR/ATC] [CAL], interceptez approche R_N_P piste [RWY], rappelez établi.
[FR/Pilot] J'intercepte approche R_N_P piste [RWY], je rappelle établi, [CAL].
[FR/ATC] [CAL], autorisé approche R_N_P piste [RWY].
[EN/Pilot] [CAL], request R_N_P approach runway [RWY].
[EN/ATC] [CAL], cleared (ODILO 1A) then R_N_P runway [RWY].
[EN/ATC] [CAL], intercept R_N_P approach runway [RWY], report established.
[EN/Pilot] Intercepting R_N_P approach runway [RWY], reporting established, [CAL].
[EN/ATC] [CAL], cleared R_N_P approach runway [RWY].  
  _Réf. manuel :_ 5.I.5 Clairance d'approche RNP — Phraséologie de base (arrivée RNAV1/RNP1 identifiée), p.145 l.6295-6312

- **APP-A3** (IFR) — Approche RNP VPT: rappel au Visual Fix et remise de gaz  
  Vérifié conforme au manuel: clairance 'RNP RWY A XX (VPT)' (l.6357), rappel à l'IAF puis au VF (5LNC/5ANNC) 'en vue' *=je poursuis (l.6383-6388), remise de gaz au/après le VF 'je remets les gaz / going around' (l.6394-6395, 6404-6405), et action contrôleur 'Perte de visual / Loss of visual — Remettez les gaz / Go around' (l.6416-6420). Le manuel précise (l.6346-6348) que cette procédure ne peut être proposée par l'ATC et n'est autorisée qu'à la demande de l'équipage. Excellent contenu avancé.  
  _Contenu proposé :_ [FR/Pilot] [CAL], demande approche pour la procédure R_N_P (V_P_T) piste [RWY].
[FR/ATC] [CAL], autorisé approche R_N_P piste [RWY] Alpha.
[FR/Pilot] Autorisé approche R_N_P piste [RWY] Alpha, je rappelle à l'I_A_F, [CAL].
[FR/ATC] [CAL], rappelez au (5LNC/5ANNC).
[FR/Pilot] (5LNC/5ANNC), en vue, [CAL].
[FR/Pilot] (5LNC/5ANNC), je remets les gaz, [CAL].
[FR/ATC] Reçu, [CAL].
[FR/ATC] [CAL], perte de visual, remettez les gaz.
[FR/Pilot] Je remets les gaz, [CAL].
[EN/Pilot] [CAL], request R_N_P (V_P_T) approach runway [RWY].
[EN/ATC] [CAL], cleared R_N_P approach runway [RWY] Alpha.
[EN/Pilot] Cleared R_N_P approach runway [RWY] Alpha, report I_A_F, [CAL].
[EN/ATC] [CAL], report at (5LNC/5ANNC).
[EN/Pilot] (5LNC/5ANNC), visual, [CAL].
[EN/Pilot] (5LNC/5ANNC), going around, [CAL].
[EN/ATC] Roger, [CAL].
[EN/ATC] [CAL], loss of visual, go around.
[EN/Pilot] Going around, [CAL].  
  _Réf. manuel :_ 5.I.5.c Procédure d'approche RNP (VPT) — Actions et Expressions, p.146-147 l.6352-6421

- **APP-A4** (IFR) — Approches à vue successives avec séparation propre assurée par le pilote  
  Vérifié conforme au manuel (variante 'sur demande du pilote', l.6092-6104): 'avez-vous visuel sur trafic précédent ?', 'assurez votre séparation avec Fokker 70 vous précédant' / 'maintain own separation from preceding Fokker 70', avec collationnement pilote. Le corrige aussi la formulation FR fautive relevée en APP-E2 ('vous précédant' et non 'devant vous' pour le cas demande pilote). Bon contenu avancé.  
  _Contenu proposé :_ [FR/Pilot] [CAL], demande approche à vue piste [RWY].
[FR/ATC] [CAL], avez-vous visuel sur trafic précédent ?
[FR/Pilot] Affirme, [CAL].
[FR/ATC] [CAL], autorisé approche à vue piste [RWY], assurez votre séparation avec (Fokker 70) vous précédant.
[FR/Pilot] Autorisé approche à vue piste [RWY], j'assure ma séparation avec (Fokker 70), [CAL].
[EN/Pilot] [CAL], request visual approach runway [RWY].
[EN/ATC] [CAL], do you have visual contact on preceding traffic ?
[EN/Pilot] Affirm, [CAL].
[EN/ATC] [CAL], cleared visual approach runway [RWY], maintain own separation from preceding (Fokker 70).
[EN/Pilot] Cleared visual approach runway [RWY], maintaining own separation from preceding (Fokker 70), [CAL].  
  _Réf. manuel :_ 5.I.4 Clairance d'approche à vue — approches successives, p.140 l.6089-6122

### J. Circuit aerodrome (VFR)

_La section circuit VFR de l'app est globalement fidele et bien structuree (integration, vent arriere, fin de vent arriere, finale, sortie/cloture), mais elle contient deux erreurs critiques de collationnement pilote sur les clairances reservees : TOUCHER et OPTION font reprendre 'autorise/cleared' par le pilote, contrairement a la regle edition 10 pourtant deja correctement appliquee sur COMPLET. Cote terminologie, 'verticale terrain' subsiste alors que l'edition 10 impose 'aerodrome', et la formulation de sequencement de trafic ('derriere') s'ecarte du standard manuel ('suivez'/'trafic precedant'). Plusieurs echanges standard du manuel manquent (allongez/continuez approche/approche directe/entree en base/360/clairance sans ATIS) et constituent une base solide pour le niveau avance actuellement vide._

#### Erreurs

- **CIRCUIT-E1** (les deux, critique) — `TOUCHER`  
  _Problème :_ Le pilote collationne l'expression reservee 'Autorise toucher' / 'Cleared to touch and go'. Comme pour 'autorise atterrissage/decollage', le pilote ne reprend jamais 'autorise/cleared' : il emploie le verbe d'action. La tache voisine COMPLET applique deja correctement la regle ('J'atterris' / 'Landing'), ce qui rend l'incoherence flagrante. Verifie : JSON lignes 121-125.  
  _Actuel :_ [FR/Pilot] Autorisé toucher piste [RWY], (numéro 2) [CAA]. / [EN/Pilot] Cleared to touch and go runway [RWY], (number X) [CAA].  
  _Corrigé :_ [FR/Pilot] (numéro 2) Je touche piste [RWY], [CAA]. / [EN/Pilot] (number X) Touch and go runway [RWY], [CAA]. (supprimer 'Autorisé'/'Cleared to' : le pilote annonce l'action, pas la clairance reservee)  
  _Réf. manuel :_ Ch.5 J.2, regle ed.10 (le pilote ne collationne pas les expressions reservees ATC) ; cf. exemples p.149-152 (lignes 6482-6626)

- **CIRCUIT-E2** (les deux, critique) — `OPTION`  
  _Problème :_ Meme faute que TOUCHER : le pilote reprend 'autorise option' / 'cleared option'. Le pilote doit collationner sans 'autorise/cleared', en indiquant l'option retenue par un verbe d'action. Verifie : JSON lignes 133-137.  
  _Actuel :_ [FR/Pilot] (numéro X), autorisé option piste [RWY], [CAA]. / [EN/Pilot] (number X), cleared option runway [RWY], [CAA].  
  _Corrigé :_ [FR/Pilot] (numéro X) Option piste [RWY], [CAA]. / [EN/Pilot] (number X) Option runway [RWY], [CAA]. (retirer 'autorisé'/'cleared' du collationnement pilote)  
  _Réf. manuel :_ Ch.5 J.2, regle ed.10 (pas de collationnement des expressions reservees ATC)

- **CIRCUIT-E3** (VFR, mineur) — `VENT_ARRIERE`  
  _Problème :_ L'ordre des elements et la ponctuation s'ecartent du modele manuel. Le manuel accole le type de main a 'vent arriere/downwind' sans virgules ('vent arrière main droite piste ...' ; 'right-hand downwind runway ...'). L'app FR insere des virgules ('En vent arrière, main gauche, piste') et l'EN inverse l'ordre ('left hand, downwind, runway') alors que le standard est 'left-hand downwind runway'. Verifie : JSON lignes 306-307.  
  _Actuel :_ [FR/Pilot] [CAA], En vent arrière, main gauche, piste [RWY]. / [EN/Pilot] [CAA], left hand, downwind, runway [RWY].  
  _Corrigé :_ [FR/Pilot] [CAA], vent arrière main gauche piste [RWY]. / [EN/Pilot] [CAA], left-hand downwind runway [RWY]. (aligner ordre et ponctuation sur le modele manuel ; type de main accolé à 'vent arrière/downwind')  
  _Réf. manuel :_ Ch.5 J.2 EXEMPLE N1 p.151 (lignes 6573, 6586) : 'vent arrière main droite piste 33 droite' / 'right-hand downwind runway 33 right'

- **CIRCUIT-E4** (VFR, majeur) — `TRANSIT`  
  _Problème :_ Emploi du terme obsolete 'verticale terrain' (FR) / 'over airfield' (EN) pour l'ATC et le pilote. L'edition 10 remplace 'terrain' par 'aerodrome' ; l'EN 'airfield' devrait suivre ('aerodrome'). S'applique aussi aux taches TRANSIT_VERTICALE (JSON lignes 223-229) et EXERCICE (JSON lignes 68-71) qui reprennent 'verticale terrain' / 'over airfield'. Verifie : JSON lignes 217-221, 223-229, 68-71.  
  _Actuel :_ [FR/ATC] [CAA], rappelez verticale terrain. / [FR/Pilot] Je rappellerai verticale terrain, [CAA]. / [EN] report over airfield.  
  _Corrigé :_ [FR/ATC] [CAA], rappelez verticale aérodrome. / [FR/Pilot] Je rappellerai verticale aérodrome, [CAA]. / [EN] report over aerodrome. (remplacer 'terrain'/'airfield' ; idem dans TRANSIT_VERTICALE et EXERCICE)  
  _Réf. manuel :_ Regle ed.10 : 'terrain' -> 'aerodrome' ; section J n'emploie jamais 'terrain' mais 'verticale (point)' p.149 (ligne 6483 'verticale E')

- **CIRCUIT-E5** (VFR, mineur) — `TOUR_PISTE_TRAFIC`  
  _Problème :_ Le manuel distingue deux formulations ATC de sequencement : 'suivez un Cessna 172, en base' (EXEMPLE N1) et 'trafic precedant un Cessna 172, en base' (EXEMPLE N2). L'app utilise 'derrière un Cessna 172 en base' / 'behind Cessna 172 on left hand base', formulation absente du manuel pour ce cas. Preferer 'suivez/follow' ou 'trafic precedant/preceding traffic'. Verifie : JSON lignes 204-207.  
  _Actuel :_ [FR/ATC] [CAA], numéro 2 derrière un Cessna 172 en base main gauche, rappelez fin de vent arrière piste [RWY]. / [EN/ATC] [CAA], number 2 behind Cessna 172 on left hand base, report end of downwind runway [RWY].  
  _Corrigé :_ [FR/ATC] [CAA], numéro 2, suivez un Cessna 172 en base main gauche, rappelez fin de vent arrière piste [RWY]. / [EN/ATC] [CAA], number 2, follow Cessna 172 on left-hand base, report end of downwind runway [RWY].  
  _Réf. manuel :_ Ch.5 J.2 EXEMPLE N1 p.151 (lignes 6575-6577) 'suivez' ; EXEMPLE N2 p.152 (lignes 6608-6610) 'trafic précédant'

#### Manquements

- **CIRCUIT-G1** (VFR) — Gestion du circuit - allongement de vent arriere  
  L'instruction 'Allongez vent arriere' / 'Extend downwind' (avec collationnement pilote) est absente du JSON. Echange courant pour espacer deux appareils dans le circuit. Verifie present au manuel (6559), absent des taches VFR circuit du JSON.  
  _Échange proposé :_ [FR/ATC] [CAA], allongez vent arrière, rappelez fin de vent arrière.
[FR/Pilot] J'allonge vent arrière, je rappellerai fin de vent arrière, [CAA].
[EN/ATC] [CAA], extend downwind, report end of downwind.
[EN/Pilot] Extending downwind, will report end of downwind, [CAA].  
  _Réf. manuel :_ Ch.5 J.2 EXPRESSIONS p.150 (lignes 6559-6560) 'Allongez vent arriere / Extend downwind'

- **CIRCUIT-G2** (VFR) — Continuez approche avec motif  
  'Continuez approche' assortie du motif (trafic degageant la piste ou au depart) est absente. Frequent en finale quand la piste n'est pas liberee ; le pilote maintient l'approche sans clairance d'atterrissage. Verifie present (6546-6551), absent du JSON.  
  _Échange proposé :_ [FR/ATC] [CAA], continuez approche, A_T_R 72 dégageant la piste.
[FR/Pilot] Je continue l'approche, [CAA].
[EN/ATC] [CAA], continue approach, A_T_R 72 vacating runway.
[EN/Pilot] Continuing approach, [CAA].  
  _Réf. manuel :_ Ch.5 J.2 EXPRESSIONS p.150 (lignes 6546-6548) 'Continuez approche, A_T_R 72 degageant la piste'

- **CIRCUIT-G3** (VFR) — Integration par approche directe  
  Le mode d'integration 'approche directe' avec rappel 'longue finale' est absent des options d'entree de zone (ENTREE_ZONE ne propose que INTEGRATION_COMPLET / INTEGRATION_TOUCHER, en vent arriere/verticale). Integration standard alternative. Verifie present (6447-6450), absent du JSON.  
  _Échange proposé :_ [FR/ATC] [CAA], exécutez approche directe piste [RWY], rappelez longue finale.
[FR/Pilot] J'exécute approche directe piste [RWY], je rappellerai longue finale, [CAA].
[EN/ATC] [CAA], make straight-in approach runway [RWY], report long final.
[EN/Pilot] Making straight-in approach runway [RWY], will report long final, [CAA].  
  _Réf. manuel :_ Ch.5 J.1 EXPRESSIONS p.148 (lignes 6447-6450) 'Executez approche directe, rappelez longue finale'

- **CIRCUIT-G4** (VFR) — Integration directe en etape de base  
  L'entree directe en base (main droite/gauche) est un ordre d'integration standard du manuel, absent des options ENTREE_ZONE qui ne proposent que l'entree en vent arriere / verticale. Verifie present (6453-6456), absent du JSON.  
  _Échange proposé :_ [FR/ATC] [CAA], entrez base main droite piste [RWY], rappelez finale.
[FR/Pilot] J'entre base main droite piste [RWY], je rappellerai finale, [CAA].
[EN/ATC] [CAA], join right-hand base runway [RWY], report final.
[EN/Pilot] Joining right-hand base runway [RWY], will report final, [CAA].  
  _Réf. manuel :_ Ch.5 J.1 EXPRESSIONS p.148 (lignes 6453-6456) 'Entrez base main droite piste 33 droite'

- **CIRCUIT-G5** (VFR) — Clairance d'entree sans ATIS (piste + vent + QNH)  
  Le manuel precise qu'en l'absence d'ATIS le controleur delivre, dans cet ordre, piste en service, direction/vitesse du vent, puis QNH avant la clairance d'entree dans le circuit. Aucun echange de l'app ne modelise ce cas (l'app suppose toujours une information ATIS ; cf. INTEGRATION_* qui portent 'avec information [INF]'). Utile pour les petits aerodromes sans ATIS. Verifie present (6461-6466), absent du JSON.  
  _Échange proposé :_ [FR/ATC] [CAA], piste en service [RWY], vent 0_6_0 degrés 10 nœuds, [QNH], entrez vent arrière main gauche piste [RWY], rappelez vent arrière.
[FR/Pilot] Piste [RWY], [QNH], j'entre vent arrière main gauche piste [RWY], je rappellerai vent arrière, [CAA].
[EN/ATC] [CAA], runway in use [RWY], wind 0_6_0 degrees 10 knots, [QNH], join left-hand downwind runway [RWY], report downwind.
[EN/Pilot] Runway [RWY], [QNH], joining left-hand downwind runway [RWY], will report downwind, [CAA].  
  _Réf. manuel :_ Ch.5 J.1 note p.148 (lignes 6461-6466) : en l'absence d'ATIS, le controleur fournit dans l'ordre piste en service, vent, QNH avant la clairance d'entree

- **CIRCUIT-G6** (VFR) — Manoeuvres de resequencement (circuit court / 360)  
  'Circuit court' / 'Short circuit' et 'Faites un 360 par la droite' / 'Make a 360 by the right' sont des manoeuvres standard de resequencement absentes du JSON. Verifie present (6553, 6556), absent du JSON.  
  _Échange proposé :_ [FR/ATC] [CAA], faites un 360 par la droite, rappelez fin de vent arrière.
[FR/Pilot] Je fais un 360 par la droite, je rappellerai fin de vent arrière, [CAA].
[EN/ATC] [CAA], make a 360 by the right, report end of downwind.
[EN/Pilot] Making a 360 by the right, will report end of downwind, [CAA].  
  _Réf. manuel :_ Ch.5 J.2 EXPRESSIONS p.150 (lignes 6553, 6556) 'Circuit court' et 'Faites un 360 par la droite'

#### Propositions niveau Avancé

- **CIRCUIT-A1** (les deux) — Sequencement dans le circuit avec trafic a suivre / trafic precedant  
  Le manuel donne deux exemples distincts d'integration sequencee en vent arriere : (1) numero + ordre de SUIVRE un trafic ('suivez un Cessna 172, en base') et (2) numero + information de TRAFIC PRECEDANT ('trafic precedant un Cessna 172, en base'). Dans les deux cas le pilote acquiert le visuel ('trafic en vue') et collationne son numero avant de rappeler base. Echange avance typique absent du niveau debutant. Verifie present (6573-6626), niveau avance vide.  
  _Contenu proposé :_ [FR/Pilot] [CAA], vent arrière main droite piste [RWY].
[FR/ATC] [CAA], numéro 3, suivez un Cessna 172, en base, rappelez base main droite piste [RWY].
[FR/Pilot] Numéro 3, trafic en vue, je rappelle base main droite piste [RWY], [CAA].
[EN/Pilot] [CAA], right-hand downwind runway [RWY].
[EN/ATC] [CAA], number 3, follow Cessna 172 on base, report right-hand base runway [RWY].
[EN/Pilot] Number 3, traffic in sight, reporting right-hand base runway [RWY], [CAA].  
  _Réf. manuel :_ Ch.5 J.2 EXEMPLE N1 p.151 (lignes 6573-6593) et EXEMPLE N2 p.152 (lignes 6606-6626)

- **CIRCUIT-A2** (les deux) — Instructions de gestion du circuit (espacement)  
  Le manuel liste des instructions ATC de gestion de l'espacement non couvertes par l'app : 'Continuez approche' (avec motif), 'Circuit court' / 'Short circuit', 'Faites un 360 par la droite' / 'Make a 360 by the right', 'Allongez vent arriere' / 'Extend downwind'. Materiau ideal pour un niveau avance sur le sequencement. Verifie present (6546-6561), niveau avance vide. NB : recouvre les manquements G1/G2/G6 (memes expressions, classees ici comme contenu avance a integrer).  
  _Contenu proposé :_ [FR/ATC] [CAA], continuez approche, A_T_R 72 dégageant la piste.
[FR/Pilot] Je continue l'approche, [CAA].
[EN/ATC] [CAA], continue approach, A_T_R 72 vacating runway.
[EN/Pilot] Continuing approach, [CAA].
---
[FR/ATC] [CAA], allongez vent arrière, rappelez fin de vent arrière.
[FR/Pilot] J'allonge vent arrière, je rappellerai fin de vent arrière, [CAA].
[EN/ATC] [CAA], extend downwind, report end of downwind.
[EN/Pilot] Extending downwind, will report end of downwind, [CAA].
---
[FR/ATC] [CAA], faites un 360 par la droite.
[FR/Pilot] Je fais un 360 par la droite, [CAA].
[EN/ATC] [CAA], make a 360 by the right.
[EN/Pilot] Making a 360 by the right, [CAA].  
  _Réf. manuel :_ Ch.5 J.2 EXPRESSIONS p.150 (lignes 6546-6561)

- **CIRCUIT-A3** (les deux) — Modes d'integration alternatifs a la vent arriere  
  Le manuel prevoit plusieurs modes d'integration absents au niveau debutant : attente a vue verticale ('Attendez a vue 5 minutes verticale S A' / 'Hold visual 5 minutes over S A', ligne 6436), approche directe ('Executez approche directe ... rappelez longue finale', ligne 6447), entree en base main droite/gauche ('Entrez base main droite piste 33 droite', ligne 6453). Materiau riche pour le niveau avance. Verifie present (6436-6456), niveau avance vide. NB : recouvre G3/G4.  
  _Contenu proposé :_ [FR/ATC] [CAA], exécutez approche directe piste [RWY], rappelez longue finale.
[FR/Pilot] J'exécute approche directe piste [RWY], je rappellerai longue finale, [CAA].
[EN/ATC] [CAA], make straight-in approach runway [RWY], report long final.
[EN/Pilot] Making straight-in approach runway [RWY], will report long final, [CAA].
---
[FR/ATC] [CAA], attendez à vue 5 minutes verticale [SORTIE].
[FR/Pilot] J'attends verticale [SORTIE], [CAA].
[EN/ATC] [CAA], hold visual 5 minutes over [SORTIE].
[EN/Pilot] Holding over [SORTIE], [CAA].  
  _Réf. manuel :_ Ch.5 J.1 EXPRESSIONS p.148 (lignes 6436-6456)

- **CIRCUIT-A4** (les deux) — Continuez approche avec trafic au depart / gros porteur  
  Le manuel prevoit 'Continuez approche Boeing 737 au depart' / 'Continue approach Boeing 737 departing' (variante 'au depart', distincte de 'degageant la piste'). Avec la regle ed.10 sur 'gros porteur/heavy', un scenario avance peut integrer un trafic gros porteur au depart devant l'appareil en finale. Verifie present (6550-6551). NB : chevauche A2/G2 (meme expression 'Continuez approche', motif different) ; a fusionner eventuellement.  
  _Contenu proposé :_ [FR/ATC] [CAA], continuez approche, Boeing 737 au départ.
[FR/Pilot] Je continue l'approche, [CAA].
[EN/ATC] [CAA], continue approach, Boeing 737 departing.
[EN/Pilot] Continuing approach, [CAA].  
  _Réf. manuel :_ Ch.5 J.2 EXPRESSIONS p.150 (lignes 6550-6551) 'Continuez approche Boeing 737 au depart' ; regle ed.10 'gros porteur/heavy'

### K. Atterrissage

_La section K. Atterrissage est globalement bien couverte : les échanges cœur (autorisé atterrissage/j'atterris, remise de gaz, après atterrissage, remontée/dégagement, traversée de piste) sont conformes à l'édition 10, y compris le collationnement pilote « j'atterris/landing » et le collationnement complet de « autorisé approche à vue ». Les principaux défauts concernent (1) le collationnement pilote de « autorisé toucher » et « autorisé option » en VFR qui répète des expressions de clairance réservées (le pilote devrait employer le verbe d'action), (2) quelques libellés d'anglais/readback non conformes, et (3) l'absence de deux échanges standard du manuel utiles en simu : la clairance anticipée d'atterrissage (n°2 derrière trafic) et surtout la clôture du plan de vol à l'arrivée (§7). Le niveau avancé est vide et peut être alimenté par l'annulation d'approche (cas particulier §3b) et la clôture de plan de vol vol non connu._

#### Erreurs

- **ATT-E1** (VFR, majeur) — `TOUCHER`  
  _Problème :_ Verifie et confirme. JSON VFR TOUCHER (l.121-125) : cote pilote 'Autorise toucher piste [RWY] / Cleared to touch and go runway [RWY]'. Le manuel (l.7114-7117) ne donne cote pilote que la DEMANDE ('Demande toucher / Request touch and go') ; 'autorise toucher / cleared touch and go' est delivre par l'ATC (l.7116-7117). Le pilote ne doit pas collationner une expression de clairance reservee : regle edition 10 (verbe d'action, cf. 'j'atterris/landing' l.6671-6672). Precision : la correction proposee n'est pas un libelle verbatim du manuel (aucun readback pilote n'y figure) mais un alignement par analogie sur la logique verbe d'action.  
  _Actuel :_ [FR/Pilot] Autorise toucher piste [RWY], (numero 2) [CAA]. / [EN/Pilot] Cleared to touch and go runway [RWY], (number X) [CAA].  
  _Corrigé :_ [FR/Pilot] Je touche piste [RWY], (numero 2) [CAA]. / [EN/Pilot] Touch and go runway [RWY], (number X) [CAA]. (alignement par analogie sur 'j'atterris/landing', le manuel ne fournissant aucun readback pilote de 'autorise toucher')  
  _Réf. manuel :_ Ch.5 K.6 Manoeuvres particulieres, p.164 (l.7111-7117)

- **ATT-E2** (VFR, majeur) — `OPTION`  
  _Problème :_ Verifie et confirme. JSON VFR OPTION (l.133-137) : cote pilote '(numero X), autorise option piste [RWY] / (number X), cleared option runway [RWY]'. Le manuel (l.7158-7161) ne donne cote pilote que 'Demande option / Request option' ; l'ATC delivre 'Piste 28, autorise option / Runway 28 cleared option'. Le pilote collationne donc une expression de clairance reservee, contraire a la regle verbe d'action de l'edition 10. Precision : correction proposee par analogie (aucun readback pilote de 'autorise option' n'existe dans le manuel).  
  _Actuel :_ [FR/Pilot] (numero X), autorise option piste [RWY], [CAA]. / [EN/Pilot] (number X), cleared option runway [RWY], [CAA].  
  _Corrigé :_ [FR/Pilot] Option piste [RWY], (numero X), [CAA]. / [EN/Pilot] Option runway [RWY], (number X), [CAA]. (verbe d'action / manoeuvre effectuee plutot que reprise de 'autorise option')  
  _Réf. manuel :_ Ch.5 K.6 Manoeuvres particulieres, p.165 (l.7149-7161)

- **ATT-E3** (IFR, mineur) — `DEGAGEMENT_STANDARD`  
  _Problème :_ Verifie et confirme. JSON IFR DEGAGEMENT_STANDARD (l.719) : '[EN/ATC] [CAL], report runway vacating.' Le manuel (l.6946) ecrit 'Report runway vacated.' (participe passe). La tache VFR homonyme (l.176) est correcte ('report runway vacated'). Simple faute d'anglais.  
  _Actuel :_ [EN/ATC] [CAL], report runway vacating.  
  _Corrigé :_ [EN/ATC] [CAL], report runway vacated.  
  _Réf. manuel :_ Ch.5 K.4 Apres atterrissage, p.160 (l.6945-6946)

- **ATT-E4** (IFR, mineur) — `DEGAGEMENT`  
  _Problème :_ Verifie et confirme. Le conteneur IFR DEGAGEMENT (l.980-983) emet comme texte propre 'vitesse controlee / speed under control' (= compte rendu d'un aeronef encore sur la piste, l.6943-6944). Son enfant DEGAGEMENT_STANDARD (l.716-720) repond 'Roger' au 'rappelez piste degagee', si bien que le compte rendu standard 'Piste degagee / Runway vacated' (l.6964-6965, illustre l.7306/7319) n'apparait nulle part en IFR. Constat pertinent : conserver 'vitesse controlee' comme premier compte rendu et ajouter le compte rendu final 'Piste degagee / Runway vacated'.  
  _Actuel :_ [FR/Pilot] [CAL], vitesse controlee. / [EN/Pilot] [CAL], speed under control.  
  _Corrigé :_ Ajouter le compte rendu final apres degagement (DEGAGEMENT_STANDARD ou conteneur) : [FR/Pilot] Piste degagee, [CAL]. / [EN/Pilot] Runway vacated, [CAL]. (cf. l.6964-6965, exemple l.7306/7319)  
  _Réf. manuel :_ Ch.5 K.4 Apres atterrissage, p.160-161 (l.6943-6944, l.6945-6946, l.6964-6965 ; exemple LVP l.7306/7319)

- **ATT-E5** (IFR, mineur) — `QUITTER`  
  _Problème :_ Verifie et confirme. JSON IFR QUITTER (l.740-744) : la ligne '[EN/Pilot]' contient du francais non traduit ('au parking, pour quitter'). La tache VFR QUITTER (l.234) est correctement traduite ('at the apron, leaving the frequency'). Collage FR dans un champ EN.  
  _Actuel :_ [EN/Pilot] [DEP] [NGND], [CAL], au parking, pour quitter.  
  _Corrigé :_ [EN/Pilot] [DEP] [NGND], [CAL], at the apron, leaving the frequency.  
  _Réf. manuel :_ Ch.5 K. (traduction) ; comparer VFR QUITTER conforme l.234

#### Manquements

- **ATT-G1** (les deux) — Cloture du plan de vol a l'arrivee (vol connu de l'organisme)  
  Verifie et confirme. Le manuel §7 (l.7170-7222) decrit la cloture du plan de vol IFR/VFR sur un aerodrome sans organisme ATC : juste avant l'atterrissage le pilote transmet un compte rendu (identification, aerodromes depart/arrivee, heure d'arrivee). Aucune tache du JSON ne couvre cet echange (grep 'cloture/closing flight plan' = nul). Frequent en VFR de club, pertinent comme conclusion de vol. Nota : l'exemple manuel du vol connu emploie l'indicatif ABREGE ('F B X', l.7217) ; adapter [CAL]/[CAA] en consequence.  
  _Échange proposé :_ [FR/Pilot] [ARR] [NSTA], [CAA], heure estimee d'arrivee 1_5_5_5, je cloture plan de vol.
[FR/ATC] [CAA], plan de vol cloture.
[EN/Pilot] [ARR] [NSTA], [CAA], estimated time of arrival 1_5_5_5, closing flight plan.
[EN/ATC] [CAA], flight plan closed.  
  _Réf. manuel :_ Ch.5 K.7 Cloture du plan de vol a l'arrivee - vol connu, p.166-167 (l.7170-7222)

- **ATT-G2** (IFR) — Clairance anticipee d'atterrissage (aeronef n2 derriere trafic)  
  Verifie et confirme. Le manuel §2 (l.6759-6770) delivre l'autorisation d'atterrissage au n2 avec mention du trafic precedent ('3 nautiques derriere un Airbus 320, ... autorise atterrissage'). Le JSON a ATTERRISSAGE_AUTORISE (l.692-696) et ATTERRISSAGE_VITESSE_CONTROLEE (l.698-702) mais pas la variante avec sequencement/trafic precedent (grep confirme : les seules occurrences 'derriere un' concernent vent arriere/alignement, pas la clairance d'atterrissage). Le readback pilote reste 'Piste [RWY], j'atterris' (conforme, l.6762).  
  _Échange proposé :_ [FR/ATC] [CAL], 3 nautiques derriere un Airbus 3_2_0, piste [RWY], autorise atterrissage, vent 0_50 degres 12 noeuds.
[FR/Pilot] Piste [RWY], j'atterris, [CAL].
[EN/ATC] [CAL], 3 miles behind an Airbus 3_2_0, runway [RWY], cleared to land, wind 0_5_0 degrees 12 knots.
[EN/Pilot] Runway [RWY], landing, [CAL].  
  _Réf. manuel :_ Ch.5 K.2 Clairance anticipee d'atterrissage, p.155-156 (l.6759-6770)

- **ATT-G4** (IFR) — Traversee de piste puis contact Sol apres traversee (arrivee)  
  Verifie et confirme. Le manuel (l.7063-7081, avec attente) detaille la sequence 'traversez piste ... et apres la traversee contactez [Sol] ...' avec collationnement pilote correspondant. Le JSON IFR TRAVERSER_PISTE (l.752-756) et ACCELERER_TRAVERSEE_PISTE (l.766-770) n'incluent pas le volet 'apres la traversee contactez Sol', echange standard a l'arrivee pour rejoindre l'aire de trafic.  
  _Échange proposé :_ [FR/ATC] [CAL], traversez piste [RWY], et apres la traversee contactez [ARR] [GND].
[FR/Pilot] Je traverse piste [RWY], et apres la traversee je contacte [ARR] [GND], [CAL].
[EN/ATC] [CAL], cross runway [RWY], and after crossing contact [ARR] [GND].
[EN/Pilot] Crossing runway [RWY] and after crossing contact [ARR] [GND], [CAL].  
  _Réf. manuel :_ Ch.5 K.5 Traversee d'une piste active - Avec attente, p.163 (l.7063-7081)

- **ATT-G5** (IFR) — Degagement grande vitesse (bretelle rapide)  
  Verifie et confirme (valeur simu limitee). Le manuel liste 'Degagement grande vitesse / High-speed turn-off' (l.6951-6952) comme expression distincte de 'degagez rapidement / expedite vacating' (l.6954-6955, deja couverte par DEGAGEMENT_PISTE VFR / ACCELERER). Absente du JSON. Instruction standard en IFR gros porteurs. Nota : le manuel ne donne pas d'exemple d'echange complet (entree de table d'expressions) ; le readback propose est reconstitue par analogie.  
  _Échange proposé :_ [FR/ATC] [CAL], degagement grande vitesse.
[FR/Pilot] Degagement grande vitesse, [CAL].
[EN/ATC] [CAL], high-speed turn-off.
[EN/Pilot] High-speed turn-off, [CAL].  
  _Réf. manuel :_ Ch.5 K.4 Apres atterrissage, p.160 (l.6951-6952)

#### Propositions niveau Avancé

- **ATT-A1** (IFR) — Annulation d'approche avant l'IF - variante 'stoppez la descente'  
  Verifie et confirme. Le manuel distingue l'approche ANNULEE (avant l'IF) de la remise de gaz (l.6786-6787, 6827-6828) et donne deux variantes de maintien : 'maintenez X pieds' (l.6836-6837) et 'stoppez la descente altitude X pieds' (l.6870-6873). Le JSON GUIDAGE_RADAR (l.945-950) ne couvre que 'annulez approche cause F_O_D, maintenez [NIV]'. La variante 'stoppez la descente' et le motif 'piste occupee' manquent. Attention : le bloc EN du manuel pour la variante 'stoppez la descente' (l.6877-6880) reutilise 'maintain 3 000 feet' (artefact de mise en page) ; harmoniser FR/EN dans le texte final (proposition ci-dessous corrigee vs l'audit initial qui melait 'stoppez la descente' FR et 'maintain' EN).  
  _Contenu proposé :_ [FR/ATC] [CAL], annulez approche cause piste occupee, stoppez la descente altitude 2_000 pieds, prevoyez guidage I_L_S piste [RWY].
[FR/Pilot] Approche annulee, je stoppe la descente altitude 2_000 pieds et prevois guidage I_L_S piste [RWY], [CAL].
[EN/ATC] [CAL], cancel approach due runway occupied, stop descent altitude 2_000 feet, expect vectoring I_L_S runway [RWY].
[EN/Pilot] Approach cancelled, stopping descent altitude 2_000 feet, expecting vectoring I_L_S runway [RWY], [CAL].  
  _Réf. manuel :_ Ch.5 K.3.b Approche interrompue - cas particulier, p.157-158 (l.6822-6880)

- **ATT-A2** (IFR) — Instruction anticipee de remise de gaz (en cas d'approche interrompue)  
  Verifie et confirme. Le manuel donne la clairance anticipee 'en cas d'approche interrompue, montez 4 000 pieds dans l'axe de piste puis tournez a droite direct T L B' (l.6803-6813, repetee l.6923-6932), delivree avant l'autorisation d'atterrissage. Note edition 10 confirmee (l.6811-6812) : 'dans l'axe de piste' = 'on runway track'. Le JSON a REMISE_GAZ (l.704-708, la remise de gaz effective) mais pas cette instruction anticipee.  
  _Contenu proposé :_ [FR/ATC] [CAL], en cas d'approche interrompue, montez 4_000 pieds dans l'axe de piste puis tournez a droite direct [WPT].
[FR/Pilot] En cas d'approche interrompue, je monte 4_000 pieds dans l'axe de piste puis tourne a droite direct [WPT], [CAL].
[EN/ATC] [CAL], in case of missed approach, climb 4_000 feet on runway track then turn right direct [WPT].
[EN/Pilot] In case of missed approach, climbing 4_000 feet on runway track then turn right direct [WPT], [CAL].  
  _Réf. manuel :_ Ch.5 K.3.a et K.3.c Approche interrompue, p.157/159 (l.6799-6813, l.6923-6932)

- **ATT-A3** (VFR) — Cloture du plan de vol quand le vol n'est pas connu de l'organisme  
  Verifie et confirme. Le manuel (l.7226-7242) montre la variante 'vol non connu' : 1er appel indicatif complet, l'organisme repond 'j'ecoute / pass your message', puis compte rendu complet (indicatif, VFR de X vers Y, ETA, cloture). Illustre l'usage indicatif complet puis abrege et le compte rendu d'arrivee reglementaire. Absente du JSON (grep confirme). Contenu avance coherent.  
  _Contenu proposé :_ [FR/Pilot] [ARR] [NSTA], [POL], [CAL].
[FR/ATC] [CAA], [POL], [ARR] [NSTA], j'ecoute.
[FR/Pilot] [CAL], V_F_R de [DEP] vers [ARR], heure estimee d'arrivee 1_5_5_5, je cloture plan de vol.
[FR/ATC] [CAA], plan de vol cloture.
[EN/Pilot] [ARR] [NSTA], [POL], [CAL].
[EN/ATC] [CAA], [POL], [ARR] [NSTA], pass your message.
[EN/Pilot] [CAL], V_F_R from [DEP] to [ARR], estimated time of arrival 1_5_5_5, closing flight plan.
[EN/ATC] [CAA], flight plan closed.  
  _Réf. manuel :_ Ch.5 K.7 Cloture du plan de vol a l'arrivee - vol non connu, p.167 (l.7226-7242)

### M+N. VFR Special & Transit

_La section Transit VFR de l'app (ENTREE_TRANSIT / TRANSIT / TRANSIT_VERTICALE / SORTIE_ZONE_TRANSIT) couvre un transit simplifié verticale aérodrome, cohérent dans son style, mais s'écarte du manuel sur deux points de forme : le terme obsolète "terrain" (édition 10 impose "aérodrome" / le mot doit être "verticale aérodrome") et un collationnement ATC réduit à un simple "Je rappellerai". Sur le fond, plusieurs échanges standard du manuel (clairance de transit avec itinéraire "de X à Y", estimée sur point, "maintenez ... rappelez avant", cas VFR spécial et transit interférant avec un IFR) sont absents et constituent la matière naturelle du niveau avancé, aujourd'hui vide._

#### Erreurs

- **TRANSIT-E1** (VFR, mineur) — `TRANSIT`  
  _Problème :_ Terme obsolète 'terrain' côté FR : édition 10 impose 'aérodrome'. Le manuel écrit 'verticale aérodrome' (l.7585-7588). En outre incohérence FR/EN : la version FR dit 'verticale terrain' alors que la version EN dit déjà 'over airfield'. Le FR doit dire 'verticale aérodrome'.  
  _Actuel :_ [FR/ATC] [CAA], rappelez verticale terrain. — [FR/Pilot] Je rappellerai verticale terrain, [CAA].  
  _Corrigé :_ [FR/ATC] [CAA], rappelez verticale aérodrome. — [FR/Pilot] Je rappellerai verticale aérodrome, [CAA]. (Idéalement aligner l'EN sur le manuel : 'overhead airfield'.)  
  _Réf. manuel :_ Chap.5 M.3 Transit VFR spécial + N. Transit VFR, p.177-178 (l.7584-7597, 7638-7643) — FR 'verticale aérodrome' / EN 'overhead airfield'

- **TRANSITVERT-E1** (VFR, mineur) — `TRANSIT_VERTICALE`  
  _Problème :_ Même terme obsolète 'terrain' côté FR (le nom de tâche et le texte pilote disent 'verticale terrain'), alors que l'EN dit 'over airfield'. Édition 10 : 'terrain' -> 'aérodrome'. Renommer la tâche et corriger le texte pilote.  
  _Actuel :_ [FR/Pilot] [CAA], verticale terrain. (nom de tâche : 'Verticale terrain')  
  _Corrigé :_ [FR/Pilot] [CAA], verticale aérodrome. (nom de tâche : 'Verticale aérodrome')  
  _Réf. manuel :_ Chap.5 M.3 Transit VFR spécial, p.177 (l.7584-7588) — 'verticale aérodrome' / 'overhead airfield'

#### Manquements

- **TRANSIT-G1** (VFR) — Clairance de transit VFR (trajectoire interférant avec un IFR)  
  L'échange central du manuel — le pilote formule la demande avec route point-à-point ('de X à Y') et estimée sur le point d'entrée ('j'estime X à ...'), puis l'ATC délivre une clairance détaillée 'transitez via ..., maintenez ... pieds, rappelez avant ...' que le pilote collationne intégralement avec verbe d'action — est absent. L'app se limite à 'rappelez verticale terrain'. Ceci recouvre aussi le point de forme de TRANSIT-E2 (demande sans route/estimée et collationnement réduit).  
  _Échange proposé :_ [FR/Pilot] [TTWR] [NTWR], [CAA], demande transit V_F_R, [ALT] pieds, de [DEP] à [SORTIE], j'estime [DEP] à [HOU]. / [FR/ATC] [CAA], transitez via [DEP], verticale aérodrome, puis [SORTIE], maintenez [ALT] pieds, et rappelez avant verticale aérodrome. / [FR/Pilot] Roger, je transite via [DEP], verticale aérodrome, puis [SORTIE], maintiens [ALT] pieds, et rappelle avant verticale aérodrome, [CAA]. // [EN/Pilot] [TTWR] [NTWR], [CAA], request V_F_R transit, [ALT] feet, from [DEP] to [SORTIE], estimating [DEP] at [HOU]. / [EN/ATC] [CAA], transit via [DEP], overhead airfield, then [SORTIE], maintain [ALT] feet and report before overhead airfield. / [EN/Pilot] Roger, transiting via [DEP], overhead airfield, then [SORTIE], maintaining [ALT] feet, calling back before overhead airfield, [CAA].  
  _Réf. manuel :_ Chap.5 N. Transit VFR, p.178 (l.7638-7643) — demande 'de W H à E N, j'estime W à 52' + clairance 'transitez via ..., maintenez ..., rappelez avant ...'

- **SORTIE-G1** (VFR) — Autorisation de poursuite de transit et report de sortie  
  Le manuel termine le transit par 'poursuivez transit vers [point], rappelez [point] pour quitter', collationné par le pilote ('Je poursuis transit vers ..., et rappelle ... pour quitter'). L'app passe directement d'un simple 'j'approche de [SORTIE]' (SORTIE_ZONE_TRANSIT) au transfert UNICOM, sans cet échange de poursuite/report de sortie.  
  _Échange proposé :_ [FR/ATC] [CAA], poursuivez transit vers [SORTIE], rappelez [SORTIE] pour quitter. / [FR/Pilot] Je poursuis transit vers [SORTIE], et rappelle [SORTIE] pour quitter, [CAA]. // [EN/ATC] [CAA], continue transit [SORTIE], report [SORTIE] to leave. / [EN/Pilot] Continuing transit [SORTIE], reporting [SORTIE] to leave, [CAA].  
  _Réf. manuel :_ Chap.5 N. Transit VFR, p.178-179 (l.7676, 7680, 7695-7696, 7705-7706) — 'poursuivez transit vers E N, rappelez E N pour quitter'

#### Propositions niveau Avancé

- **TRANSIT-A1** (VFR) — Départ VFR spécial (clairance sol avec itinéraire codé, altitude, transpondeur, roulage)  
  Départ V_F_R spécial : demande sol, autorisation avec itinéraire de départ codé (S A), altitude, transpondeur et roulage point d'attente ; collationnement pilote complet avec verbe d'action 'je roule'. Verbatim manuel. Absent de l'app, matière avancée idéale.  
  _Contenu proposé :_ [FR/Pilot] [DEP] [NGND], [CAA], demande départ V_F_R spécial. / [FR/ATC] [CAA], autorisé départ V_F_R spécial S A, [ALT] pieds, transpondeur [SQU], roulez point d'attente piste [RWY]. / [FR/Pilot] Je roule point d'attente piste [RWY], S A 1, [ALT] pieds, transpondeur [SQU], [CAA]. // [EN/Pilot] [DEP] Ground, [CAA], request special V_F_R departure. / [EN/ATC] [CAA], cleared special V_F_R departure S A, [ALT] feet, squawk [SQU], taxi holding point runway [RWY]. / [EN/Pilot] Taxiing holding point runway [RWY], S A 1, [ALT] feet, squawking [SQU], [CAA].  
  _Réf. manuel :_ Chap.5 M.1 Départ VFR spécial, p.174 (l.7499-7503 FR, 7508-7512 EN)

- **TRANSIT-A2** (VFR) — Refus de VFR spécial pour visibilité insuffisante  
  Cas du refus : l'ATC répond 'négatif, visibilité inférieure à 1300 mètres' et le pilote accuse réception ('Roger'). Illustre le seuil de visibilité et la gestion d'un refus. Verbatim manuel. Matière avancée.  
  _Contenu proposé :_ [FR/Pilot] [DEP] [NGND], [CAA], demande départ V_F_R spécial. / [FR/ATC] [CAA], négatif, visibilité inférieure à 1300 mètres. / [FR/Pilot] Roger, [CAA]. // [EN/Pilot] [DEP] Ground, [CAA], request special V_F_R. / [EN/ATC] [CAA], negative, visibility less than 1300 metres. / [EN/Pilot] Roger, [CAA].  
  _Réf. manuel :_ Chap.5 M.1 Départ VFR spécial, p.175 (l.7517-7519 FR, 7523-7525 EN)

- **TRANSIT-A3** (VFR) — Arrivée VFR spécial (clairance avec itinéraire d'arrivée, transpondeur, attente à vue)  
  Arrivée V_F_R spécial : autorisation avec itinéraire d'arrivée codé (N A 1), altitude, transpondeur, 'rappelez [point]', plus la variante d'attente à vue 'Attendez à vue 10 minutes verticale [point]'. Verbatim manuel. Absent de l'app.  
  _Contenu proposé :_ [FR/Pilot] [ARR] [Tour], [CAA], demande arrivée V_F_R spécial. / [FR/ATC] [CAA], autorisé arrivée V_F_R spécial N A 1, [ALT] pieds, transpondeur [SQU], rappelez [SORTIE]. / [FR/Pilot] Autorisé arrivée V_F_R spécial N A 1, [ALT] pieds, transpondeur [SQU], je rappelle [SORTIE], [CAA]. (<i>variante attente :</i> [FR/ATC] Attendez à vue 10 minutes verticale [SORTIE]. / [FR/Pilot] J'attends vertical [SORTIE], [CAA].) // [EN/Pilot] [ARR] Tower, [CAA], request special V_F_R arrival. / [EN/ATC] [CAA], cleared special V_F_R arrival N A 1, [ALT] feet, squawk [SQU], report [SORTIE]. / [EN/Pilot] Cleared special V_F_R arrival N A 1, [ALT] feet, squawking [SQU], reporting [SORTIE], [CAA].  
  _Réf. manuel :_ Chap.5 M.2 Arrivée VFR spécial, p.176 (l.7552-7556, 7561-7565 ; attente à vue l.7542-7543)

- **TRANSIT-A4** (VFR) — Transit VFR spécial sur itinéraire publié (via waypoints, verticale aérodrome)  
  Transit V_F_R spécial sur itinéraire publié : demande avec via [waypoints] / verticale aérodrome / sortie, clairance ATC codée et collationnement pilote. Utilise correctement 'verticale aérodrome / overhead airfield' (édition 10). Plus riche que le transit simplifié de l'app.  
  _Contenu proposé :_ [FR/Pilot] [NTWR] [Tour], [CAA], demande transit V_F_R spécial, [ALT] pieds, via W H 1, verticale aérodrome, E N 1, sortie [SORTIE]. / [FR/ATC] [CAA], autorisé V_F_R spécial, W H 1, verticale aérodrome, E N 1, [ALT] pieds, rappelez W D. / [FR/Pilot] Autorisé transit W H 1, verticale aérodrome, E N 1, [ALT] pieds, je rappelle W D, [CAA]. // [EN/Pilot] [NTWR] Tower, [CAA], request special V_F_R transit, [ALT] feet, via W H 1, overhead airfield, E N 1, [SORTIE]. / [EN/ATC] [CAA], cleared special V_F_R, W H 1, overhead airfield, to E N 1, [ALT] feet, report W D. / [EN/Pilot] Transiting W H 1, overhead airfield, E N 1, [ALT] feet, reporting W D, [CAA].  
  _Réf. manuel :_ Chap.5 M.3 Transit VFR spécial — itinéraire publié, p.177 (l.7584-7597)

- **TRANSIT-A5** (VFR) — Transit VFR spécial hors itinéraire publié (point à point avec estimée)  
  Transit V_F_R spécial hors itinéraire : demande point-à-point avec estimée horaire ('Hénin à 52'), clairance 'direct' et collationnement. Verbatim manuel. Illustre la variante hors itinéraire.  
  _Contenu proposé :_ [FR/Pilot] [NTWR] [Tour], [CAA], demande V_F_R spécial, [ALT] pieds, [DEP] vers [SORTIE], [DEP] à [HOU]. / [FR/ATC] [CAA], autorisé V_F_R spécial, [ALT] pieds, [DEP] [SORTIE] direct, rappelez [DEP]. / [FR/Pilot] [DEP] [SORTIE], autorisé transit V_F_R spécial [ALT] pieds, je rappelle [DEP], [CAA]. // [EN/Pilot] [NTWR] Tower, [CAA], request special V_F_R, [ALT] feet, from [DEP] to [SORTIE] direct, [DEP] time [HOU]. / [EN/ATC] [CAA], cleared special V_F_R, [ALT] feet, [DEP] [SORTIE], report [DEP]. / [EN/Pilot] [DEP] [SORTIE], [ALT] feet, reporting [DEP], [CAA].  
  _Réf. manuel :_ Chap.5 M.3 Transit VFR spécial — hors itinéraire publié, p.177 (l.7603-7616)

- **TRANSIT-A6** (VFR) — Transit interférant avec un IFR : recherche de contact visuel et 360 de retardement  
  Séquence avancée : l'ATC demande le visuel sur un IFR au départ ; si contact -> poursuite du transit ; si pas de contact -> '360 de retardement' au point puis reprise. Verbatim manuel. Gestion de trafic conflictuel, matière avancée idéale.  
  _Contenu proposé :_ [FR/Pilot] J'approche W D, [CAA]. / [FR/ATC] [CAA], avez-vous visuel sur un Airbus 320 au départ ? — <i>Si contact :</i> [FR/Pilot] Affirme, Airbus 320 en vue, [CAA]. / [FR/ATC] [CAA], poursuivez transit vers [SORTIE], rappelez [SORTIE] pour quitter. — <i>Si pas de contact :</i> [FR/Pilot] Négatif, pas de contact visuel, [CAA]. / [FR/ATC] [CAA], faites un 360 de retardement à W D, je vous rappelle pour poursuivre. (puis le départ passé) [CAA], poursuivez transit vers [SORTIE], rappelez [SORTIE] pour quitter. // [EN/Pilot] Approaching W D, [CAA]. / [EN/ATC] [CAA], do you have visual contact with Airbus 320 departing? — <i>If contact:</i> [EN/Pilot] Affirm, Airbus 320 in sight, [CAA]. / [EN/ATC] [CAA], continue transit [SORTIE], report [SORTIE] to leave. — <i>If no contact:</i> [EN/Pilot] Negative, no visual contact, [CAA]. / [EN/ATC] [CAA], make a 360 delaying action at W D, I call you back to continue.  
  _Réf. manuel :_ Chap.5 N. Transit VFR, p.178-179 (l.7658-7663, 7672-7706) — contact visuel IFR au départ et 360 de retardement

---

## Points reportés

- **Rôle « Véhicule » (FLYCO / intervention sur piste)** — Les tâches `TRAVERSEE_VEHICULE_FLYCO` (intermédiaire) et `INSPECTION_PISTE_FLYCO` (avancé) mettent en scène un **véhicule** (conducteur dialoguant avec FLYCO), pas un aéronef. Faute d'un rôle dédié, elles utilisent pour l'instant le rôle **`Pilot`** (icône casque), ce qui est sémantiquement imprécis. **À faire plus tard :** introduire une 3ᵉ classe `_class: "Vehicle"` avec une icône propre (voiture/gyrophare) et son rendu dans `TaskTextDisplay` / `Tabs`. Contenu conservé en l'état d'ici là.
