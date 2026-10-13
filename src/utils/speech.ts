/**
 * Texte → parole : prépare une réplique (déjà passée par replacePlaceholders) pour la synthèse vocale.
 *
 * Le moteur reçoit un texte entièrement en mots, pour ne rien lui laisser deviner :
 * - notes {…}, balises HTML et parenthèses d'exemple retirées (le contenu des parenthèses est dit)
 * - lettres isolées (indicatif « F S T », taxiway « W 4 ») et immatriculations « F-EPST » : alphabet OACI
 * - groupes à underscores : sigles lettre par lettre (Q_N_H), mots tels quels (Bubli_3_Papa)
 * - types Airbus : A320 → « Airbus trois cent vingt » (pas « Alfa »)
 * - nombres (wiki IVAO France / manuel DGAC) :
 *   - FR : langage courant (« transpondeur mille », « niveau cent dix »), même écrits 1_1_0 ;
 *     chiffre par chiffre seulement avec un zéro initial ; « unité » pour un chiffre 1 seul dans un identifiant
 *   - EN : chiffre par chiffre, sauf centaines/milliers ronds et heures de trafic ; « tree », « fife », « niner »
 * - quelques mots réécrits pour la voix française (Whiskey, Boeing)
 */
export type SpeechLang = 'fr' | 'en';

export const OACI_WORDS: Record<string, string> = {
  A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel',
  I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa',
  Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey',
  X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
};

/** Nom des lettres d'un sigle (Q_N_H), écrit pour être lu correctement par une voix française */
const FR_LETTER_NAMES: Record<string, string> = {
  A: 'a', B: 'bé', C: 'cé', D: 'dé', E: 'eu', F: 'èf', G: 'gé', H: 'ache', I: 'i', J: 'ji', K: 'ka',
  L: 'èl', M: 'èm', N: 'ène', O: 'o', P: 'pé', Q: 'ku', R: 'èr', S: 'èss', T: 'té', U: 'u', V: 'vé',
  W: 'double vé', X: 'ixe', Y: 'i grec', Z: 'zède',
};

const EN_CLOCK = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

const DIGITS: Record<SpeechLang, string[]> = {
  fr: ['zéro', 'unité', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'],
  en: ['zero', 'one', 'two', 'tree', 'four', 'fife', 'six', 'seven', 'eight', 'niner'],
};

/** Mots anglais mal prononcés par la voix française : réécrits phonétiquement */
const FR_PRONUNCIATION: Record<string, string> = {
  Whiskey: 'Ouisski',
  Whisky: 'Ouisski',
  Boeing: 'Boïngue',
};

/** Noms féminins après « 1 » : « une minute » */
const FR_FEMININE_NEXT = /^\s+(?:minutes?|heures?|secondes?)\b/i;

const digitByDigit = (n: string, lang: SpeechLang): string =>
  n.split('').map((d) => DIGITS[lang][Number(d)]).join(' ');

// ── Nombres en français courant ──────────────────────────────────────────────

const FR_UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
];
const FR_TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function frBelow100(n: number): string {
  if (n < 20) return FR_UNITS[n];
  const t = Math.floor(n / 10);
  // 70-79 et 90-99 : soixante-dix…, quatre-vingt-dix…
  const u = t === 7 || t === 9 ? (n % 10) + 10 : n % 10;
  if (u === 0) return t === 8 ? 'quatre-vingts' : FR_TENS[t];
  if ((u === 1 || u === 11) && t < 8) return `${FR_TENS[t]} et ${FR_UNITS[u]}`;
  return `${FR_TENS[t]}-${FR_UNITS[u]}`;
}

function frBelow1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h === 0) return frBelow100(r);
  const hundreds = h === 1 ? 'cent' : `${FR_UNITS[h]} cent${r === 0 ? 's' : ''}`;
  return r === 0 ? hundreds : `${hundreds} ${frBelow100(r)}`;
}

/** Nombre en toutes lettres (français courant, jusqu'à 999 999) */
export function frenchNumber(n: number): string {
  if (n < 1000) return frBelow1000(n);
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  const thousands = th === 1 ? 'mille' : `${frBelow1000(th).replace(/(cent|vingt)s$/, '$1')} mille`;
  return r === 0 ? thousands : `${thousands} ${frBelow1000(r)}`;
}

// ── Nombres en anglais (OACI) ────────────────────────────────────────────────

/** Chiffre par chiffre, sauf centaines et milliers ronds : 2500 → two thousand fife hundred */
export function englishNumber(n: string): string {
  const v = Number(n);
  if (/^0/.test(n) || v < 100 || v % 100 !== 0) return digitByDigit(n, 'en');
  const th = Math.floor(v / 1000);
  const h = (v % 1000) / 100;
  return [th ? `${digitByDigit(String(th), 'en')} thousand` : '', h ? `${DIGITS.en[h]} hundred` : '']
    .filter(Boolean)
    .join(' ');
}

/** Un nombre isolé, selon la langue et le contexte (code ou non) */
function sayNumber(n: string, lang: SpeechLang, feminine = false): string {
  if (lang === 'en') return englishNumber(n);
  if (n.length > 1 && n.startsWith('0')) return digitByDigit(n, 'fr');
  // « unité » ne vaut que chiffre par chiffre : « numéro un », « éloignement une minute »
  return feminine && n === '1' ? 'une' : frenchNumber(Number(n));
}

// ── Texte complet ────────────────────────────────────────────────────────────

const decodeEntities = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/** Chiffres d'un identifiant (W41, S A 1) : « unité » pour un 1 seul, sinon comme un nombre */
const sayIdentifierDigits = (n: string, lang: SpeechLang) => (n.length === 1 ? DIGITS[lang][Number(n)] : sayNumber(n, lang));

const spell = (letters: string) => letters.split('').map((l) => OACI_WORDS[l.toUpperCase()]).join(' ');

/** Mot en capitales (point de report BUBLI) : écrit en minuscules pour être lu, pas épelé */
const asWord = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

/**
 * Groupe à underscores : Q_N_H → lettres ; Bubli_3_Papa → mots ;
 * chiffres : un par un en anglais (1_5_5_5), en français le nombre entier (1_1_0 → cent dix)
 * sauf zéro initial (0_25 → zéro vingt-cinq)
 */
function sayUnderscored(group: string, lang: SpeechLang): string {
  if (lang === 'fr' && /^[1-9](?:_\d)+$/.test(group)) return sayNumber(group.replace(/_/g, ''), lang);
  return group
    .split('_')
    .map((part) => {
      if (/^\d$/.test(part)) return DIGITS[lang][Number(part)];
      if (/^\d+$/.test(part)) return sayNumber(part, lang, false);
      if (/^[A-Z]$/i.test(part)) return lang === 'fr' ? FR_LETTER_NAMES[part.toUpperCase()] : part.toUpperCase();
      return /^[A-Z]{2,}$/.test(part) ? asWord(part) : part;
    })
    .join(' ');
}

export function toSpeech(text: string, lang: SpeechLang): string {
  let s = decodeEntities(text.replace(/<[^>]*>/g, ' '))
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/[()]/g, ' ');

  // Airbus : A320 → « Airbus trois cent vingt » (un « A » seul serait épelé « Alfa »)
  s = s.replace(/\b(?:Airbus\s+)?A ?([23]\d0)\b/g, (_m, n: string) => `Airbus ${sayNumber(n, lang)}`);

  // Immatriculation : F-EPST → Foxtrot Echo Papa Sierra Tango
  s = s.replace(/\b([A-Z]{1,2})-([A-Z]{2,4})\b/g, (_m, a: string, b: string) => spell(a + b));

  // Mélange lettres/chiffres (W41, 5Z, 3PAPA) : lettre isolée en OACI, chiffres comme un identifiant
  s = s.replace(/\b(?=[A-Z]*\d)(?=\d*[A-Z])[A-Z\d]+\b/g, (token) =>
    (token.match(/\d+|[A-Z]+/g) ?? [])
      .map((run) => (/\d/.test(run) ? sayIdentifierDigits(run, lang) : run.length === 1 ? spell(run) : asWord(run)))
      .join(' ')
  );

  // Suites de lettres isolées (indicatif abrégé « F S T », taxiway « S A 1 » avec ses chiffres) ;
  // « I » anglais seul reste un pronom
  s = s.replace(/(?<![\w'’-])([A-Z](?:\s+[A-Z](?![\w'’-]))*)(?:\s+(\d+))?(?![\w'’-])/g, (seq, letters: string, digits?: string) =>
    lang === 'en' && seq === 'I'
      ? seq
      : [spell(letters.replace(/\s+/g, '')), digits ? sayIdentifierDigits(digits, lang) : ''].filter(Boolean).join(' ')
  );

  s = s.replace(/\b[A-Za-z\d]+(?:_[A-Za-z\d]+)+\b/g, (group) => sayUnderscored(group, lang));

  // Séparateur de milliers : « 1 800 » → 1800
  s = s.replace(/\b(\d{1,3}) (\d{3})\b/g, '$1$2');

  // Position horaire d'un trafic : « eleven o'clock » (pas chiffre par chiffre)
  if (lang === 'en') s = s.replace(/\b(1[0-2]|[1-9])(?=\s*o['’]clock)/g, (n) => EN_CLOCK[Number(n)]);

  // Nombres restants, avec signe éventuel (température)
  s = s.replace(/(^|[^\w-])-(\d+)\b/g, (_m, pre: string, n: string) => `${pre}${lang === 'fr' ? 'moins' : 'minus'} ${n}`);
  s = s.replace(/\d+/g, (n, offset: number, all: string) =>
    sayNumber(n, lang, FR_FEMININE_NEXT.test(all.slice(offset + n.length)))
  );

  // Points de report en capitales restants (BASIP, ODILO) : lus comme des mots
  s = s.replace(/\b[A-Z]{5,}\b/g, asWord);

  if (lang === 'fr') s = s.replace(/\b[A-Z][a-z]+\b/g, (w) => FR_PRONUNCIATION[w] ?? w);

  return s
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
