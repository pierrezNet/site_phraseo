/**
 * Vocabulaire fourni aux moteurs pour mieux reconnaître les termes aéronautiques.
 * Jamais de nombres ni de valeurs attendues (QNH, niveau, transpondeur…) : le moteur
 * « corrigerait » alors une erreur de l'élève vers la bonne réponse.
 */
const OACI = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike',
  'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu',
];

const BASE: Record<'fr' | 'en', string[]> = {
  fr: ['Prévol', 'Sol', 'Tour', 'Approche', 'Contrôle', 'décimale', 'transpondeur', 'Q N H', 'point d\'attente', 'vent arrière', 'collationnez', 'Wilco', 'Roger'],
  en: ['Delivery', 'Ground', 'Tower', 'Approach', 'Control', 'decimal', 'squawk', 'Q N H', 'holding point', 'downwind', 'niner', 'tree', 'fife', 'Wilco', 'Roger'],
};

/** Noms propres (mots à majuscule, sans chiffre) présents dans les phrases attendues */
export function properNouns(texts: string[]): string[] {
  const words = texts.flatMap((t) => t.match(/\b[A-ZÉÈ][\p{L}-]+/gu) ?? []);
  return [...new Set(words.filter((w) => w.length > 2))];
}

export function vocabulary(lang: 'fr' | 'en', texts: string[] = []): string[] {
  return [...new Set([...BASE[lang], ...OACI, ...properNouns(texts)])];
}
