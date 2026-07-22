// Regroupement des tâches par sous-thème (accordéon), calculé au runtime
// à partir du nom/id de la tâche — aucune donnée stockée dans les JSON.

const norm = (s: string): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

interface GroupRule {
  name: string;
  re: RegExp;
}

// Groupes ordonnés par phase (le 1er motif qui matche gagne).
// Les motifs VFR (circuit, transit…) et IFR cohabitent : ils ne matchent
// que leurs tâches respectives.
const RULES: Record<string, GroupRule[]> = {
  SO: [
    { name: 'Mise en route', re: /mise en route|param|heure|plan de vol|prevoyez depart|dman|tobt/ },
    { name: 'Repoussage', re: /repouss/ },
    { name: 'Roulage', re: /roulage|circulation|suivez|priorite|cheminement/ },
    { name: "Point d'attente & alignement", re: /maintien|point d.attente|pret|tora|alignement|position/ },
    { name: 'Traversée & tractage', re: /traversee|vehicule|flyco|inspection|tractage/ },
    { name: 'VFR spécial', re: /special/ },
    { name: 'Transferts', re: /transfert|contact/ },
  ],
  DE: [
    { name: 'Alignement & décollage', re: /alignement|decollage|axe de piste|point d.attente|immediat/ },
    { name: 'Départ & guidage', re: /depart|sid|guidage|virage/ },
    { name: 'Montée & niveau', re: /montee|niveau|contrainte|taux|rvsm|liberant/ },
    { name: 'Transferts', re: /transfert|contact/ },
  ],
  CR: [
    { name: 'Transit', re: /transit|verticale/ },
    { name: 'Circuit & intégration', re: /vent arriere|circuit|etape de base|finale|integration|sortie de zone|entree|atis/ },
    { name: 'Clôture plan de vol', re: /cloture|plan de vol/ },
    { name: 'Route & position', re: /route|procedez|offset|destination|position|compte rendu/ },
    { name: 'Niveau & vitesse', re: /niveau|vitesse/ },
    { name: 'Trafic & séparation', re: /trafic|separation|regulation|evitement|meteo/ },
    { name: 'IFR en vol', re: /annulation|cpdlc|classe|service|modification|clairance/ },
    { name: 'Transferts', re: /transfert|contact/ },
  ],
  AP: [
    { name: 'Descente', re: /descente/ },
    { name: 'Vitesse', re: /vitesse|mach/ },
    { name: 'Attente', re: /attente|retardement/ },
    { name: 'Circuit (finale)', re: /vent arriere|finale|circuit|360|sequencement|atterrissage|allonger/ },
    { name: 'Approche RNP', re: /rnp/ },
    { name: 'Approche à vue / MVL', re: /approche a vue|mvl|vpt/ },
    { name: 'Approche & STAR', re: /star|arrivee|approche standard|directe|impossible|familier|approche/ },
    { name: 'Guidage & régulation', re: /guidage|regulation|radar/ },
    { name: 'Remise de gaz', re: /remise|stop.*descente|annulee/ },
    { name: 'Transferts', re: /transfert|contact/ },
  ],
  AT: [
    { name: 'Atterrissage', re: /atterrissage|toucher|option|anticipe/ },
    { name: 'Remise de gaz', re: /remise/ },
    { name: 'Dégagement & traversée', re: /degagement|traversee|vitesse controlee/ },
    { name: 'Après atterrissage', re: /parking|quitter|circulation|taxi|contact|transfert|cloture|plan de vol/ },
  ],
  EX: [
    { name: 'Expressions', re: /.*/ },
  ],
};

/** Renvoie le nom du sous-thème d'une tâche pour une phase (tab) donnée. */
export function groupOf(task: { _name?: string; _id?: string }, tab: string): string {
  const rules = RULES[tab];
  if (!rules) return 'Autres';
  const key = norm((task._name || '') + ' ' + (task._id || ''));
  for (const g of rules) {
    if (g.re.test(key)) return g.name;
  }
  return 'Autres';
}

/** Ordre d'affichage des groupes d'une phase. */
export function groupOrder(tab: string): string[] {
  return (RULES[tab] || []).map((g) => g.name).concat('Autres');
}
