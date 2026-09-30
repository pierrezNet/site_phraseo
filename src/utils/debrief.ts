/**
 * Débriefing : erreurs de phraséologie repérées dans une réponse pilote, au-delà du score.
 * Logique pure (sans Vue), testée dans debrief.test.ts.
 */
import { tokenize } from './quizScoring';

export type RemarkCode =
  | 'CALLSIGN_ABBREVIATED_EARLY'
  | 'INTENT_MISSING'
  | 'ATC_RESERVED'
  | 'ROGER_INSTEAD_OF_READBACK'
  | 'MISSING_UNIT';

export const REMARKS: Record<RemarkCode, { title: string; advice: string }> = {
  CALLSIGN_ABBREVIATED_EARLY: {
    title: 'Indicatif abrégé employé trop tôt',
    advice:
      "L'indicatif abrégé n'est utilisable qu'après un premier échange avec l'indicatif complet, et seulement à l'initiative du contrôleur (manuel p. 18). Au premier contact d'un nouvel organisme, utilisez l'indicatif complet.",
  },
  INTENT_MISSING: {
    title: 'Intention non annoncée',
    advice:
      "Annoncez votre intention (complet, toucher…) dans le message : sans elle, le contrôleur doit vous la demander, ce qui charge la fréquence.",
  },
  ATC_RESERVED: {
    title: "Expression réservée à l'ATC",
    advice:
      "« Autorisé atterrissage / décollage » est réservé au contrôleur : le pilote collationne avec le verbe d'action (« j'atterris », « je décolle ») (manuel p. 59-61).",
  },
  ROGER_INSTEAD_OF_READBACK: {
    title: '« Roger » à la place du collationnement',
    advice:
      "« Roger » signifie seulement « message reçu » : il ne remplace jamais le collationnement des éléments obligatoires (fréquence, transpondeur, QNH, cap, niveau, piste… manuel p. 34).",
  },
  MISSING_UNIT: {
    title: 'Valeur collationnée sans son unité',
    advice:
      "Collationnez la valeur avec son unité (pieds, nœuds, degrés…) : « 2 500 » seul est ambigu (altitude ? niveau ? vitesse ?).",
  },
};

/** Suite de mots `needle` présente dans `haystack` (mots déjà normalisés) */
const containsSequence = (haystack: string[], needle: string[]): boolean =>
  needle.length > 0 && ` ${haystack.join(' ')} `.includes(` ${needle.join(' ')} `);

const ATC_RESERVED_RE = /autoris[e]+s? (a l )?(atterrissage|decollage|atterrir|decoller)|cleared (to land|for take ?off)/;

/** Unités après une valeur chiffrée (formes normalisées) */
const UNITS = new Set(['pieds', 'pied', 'feet', 'ft', 'noeuds', 'noeud', 'knots', 'kt', 'degres', 'degre', 'degrees', 'nautiques', 'miles', 'metres', 'meters']);

interface RemarkContext {
  /** Texte source de la réplique, avec ses tags ([CAL], [CAA]…) */
  source: string;
  /** Réplique attendue, telle que prononcée */
  expected: string;
  /** Réponse tapée */
  answer: string;
  /** Indicatifs complet et abrégé du vol */
  callsign: { cal: string; caa: string };
}

/** Mots de la réponse, sans l'indicatif (complet ou abrégé) */
const withoutCallsign = (words: string[], callsign: RemarkContext['callsign']): string[] => {
  let text = ` ${words.join(' ')} `;
  for (const c of [callsign.cal, callsign.caa]) {
    const t = tokenize(c).join(' ');
    if (t) text = text.split(` ${t} `).join(' ');
  }
  return text.trim().split(/\s+/).filter(Boolean);
};

/**
 * « Roger » (seul, avec l'indicatif) là où un collationnement est attendu.
 * Toujours faux : la réplique doit échouer, quel que soit le score.
 */
export function isRogerInsteadOfReadback({ expected, answer, callsign }: Omit<RemarkContext, 'source'>): boolean {
  const expectedWords = tokenize(expected);
  if (expectedWords.includes('roger')) return false; // « Roger » est la réponse attendue
  const rest = withoutCallsign(tokenize(answer), callsign);
  return rest.length === 1 && rest[0] === 'roger' && withoutCallsign(expectedWords, callsign).length > 0;
}

/** Remarques de débriefing sur une réponse pilote */
export function detectRemarks(ctx: RemarkContext): RemarkCode[] {
  const { source, expected, answer, callsign } = ctx;
  const remarks: RemarkCode[] = [];
  const words = tokenize(answer);

  const cal = tokenize(callsign.cal);
  const caa = tokenize(callsign.caa);
  const expectsFullCallsign = source.includes('[CAL]') && !source.includes('[CAA]');
  if (expectsFullCallsign && caa.join(' ') !== cal.join(' ') && containsSequence(words, caa) && !containsSequence(words, cal)) {
    remarks.push('CALLSIGN_ABBREVIATED_EARLY');
  }

  if (ATC_RESERVED_RE.test(words.join(' '))) remarks.push('ATC_RESERVED');

  if (isRogerInsteadOfReadback(ctx)) remarks.push('ROGER_INSTEAD_OF_READBACK');

  // Valeur attendue « 2500 pieds » : la réponse contient 2500 sans l'unité juste après
  const expectedWords = tokenize(expected);
  const missingUnit = expectedWords.some((w, i) => {
    const unit = expectedWords[i + 1];
    if (!/^\d+$/.test(w) || !unit || !UNITS.has(unit)) return false;
    return words.some((u, j) => u === w && words[j + 1] !== unit);
  });
  if (missingUnit) remarks.push('MISSING_UNIT');

  return remarks;
}
