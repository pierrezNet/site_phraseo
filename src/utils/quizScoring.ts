/**
 * Élément critique de phraséologie (doit être exact à 100 %).
 * Ex. : { label: 'Piste', value: '26 Gauche' }
 */
export interface Critical {
  label: string
  value: string
}

export interface CriticalResult extends Critical {
  ok: boolean
}

export interface QuizResult {
  /** Note globale 0-100 (mélange critiques + similarité des mots). */
  score: number
  /** Similarité « accessoire » basée sur les mots (0-100). */
  accessory: number
  /** Résultat par élément critique. */
  criticals: CriticalResult[]
  /** Exercice validé : tous les critiques présents ET note globale suffisante. */
  passed: boolean
}

/**
 * Seuil de note globale au-delà duquel la réponse est acceptée (critiques justes exigés).
 * Les mots oubliés pèsent déjà dans la note (rappel = 70 % de la similarité) : pas de seuil séparé,
 * pour que la note affichée suffise à expliquer la validation.
 */
export const PASS_THRESHOLD = 75

/** Tags de placeholders considérés comme critiques, avec leur libellé lisible. */
export const CRITICAL_TAGS: Record<string, string> = {
  QNH: 'QNH',
  RWY: 'Piste',
  ALT: 'Altitude',
  NIV: 'Niveau',
  DEL: 'Fréquence Prévol',
  GND: 'Fréquence Sol',
  TWR: 'Fréquence Tour',
  APP: 'Fréquence Approche',
  CTR: 'Fréquence Contrôle',
  CAP: 'Cap',
  VIT: 'Vitesse',
  SQU: 'Transpondeur',
  STA: 'SID/STAR',
  WPT: 'Point de report',
  HLD: "Point d'attente",
  VOI: 'Cheminement',
  INF: 'Information ATIS',
  // Règle OACI du collationnement : l'indicatif est toujours exigé (complet ≡ abrégé via les équivalences)
  CAL: 'Indicatif',
  CAA: 'Indicatif',
}

/** Alphabet aéronautique OACI → lettre (Lima = L, etc.). */
const OACI_ALPHABET: Record<string, string> = {
  alpha: 'a', bravo: 'b', charlie: 'c', delta: 'd', echo: 'e',
  foxtrot: 'f', golf: 'g', hotel: 'h', india: 'i', juliett: 'j', juliet: 'j',
  kilo: 'k', lima: 'l', mike: 'm', november: 'n', oscar: 'o', papa: 'p',
  quebec: 'q', romeo: 'r', sierra: 's', tango: 't', uniform: 'u',
  victor: 'v', whiskey: 'w', whisky: 'w', xray: 'x', yankee: 'y', zulu: 'z',
}

/** Chiffres et nombres dits en toutes lettres (FR + EN, prononciations OACI incluses). */
const DIGIT_WORDS: Record<string, number> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  one: 1, two: 2, three: 3, tree: 3, four: 4, five: 5, fife: 5, seven: 7, eight: 8, nine: 9, niner: 9,
}
const COMPOUND_WORDS: Record<string, number> = {
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}
const HUNDRED = new Set(['cent', 'cents', 'hundred'])
const THOUSAND = new Set(['mille', 'thousand'])

const isNumberWord = (w: string) =>
  w in DIGIT_WORDS || w in COMPOUND_WORDS || HUNDRED.has(w) || THOUSAND.has(w)

/** Valeur d'une suite composée : « deux mille cinq cents » → 2500, « quatre vingt dix » → 90. */
function compoundValue(words: string[]): number {
  let total = 0
  let current = 0
  words.forEach((w, i) => {
    if (HUNDRED.has(w)) current = (current || 1) * 100
    else if (THOUSAND.has(w)) {
      total += (current || 1) * 1000
      current = 0
    } else if ((w === 'vingt' || w === 'vingts') && words[i - 1] === 'quatre') current += 76 // 4 → 80
    else current += DIGIT_WORDS[w] ?? COMPOUND_WORDS[w] ?? 0
  })
  return total + current
}

/**
 * Convertit les nombres dits en toutes lettres en chiffres :
 * - une suite de chiffres isolés est épelée (« un un zéro » → 110) ;
 * - une suite contenant dizaines/cent/mille est composée (« cent dix » → 110).
 */
function wordsToNumbers(words: string[]): string[] {
  const out: string[] = []
  let i = 0
  while (i < words.length) {
    if (!isNumberWord(words[i])) {
      out.push(words[i++])
      continue
    }
    const group: string[] = []
    while (i < words.length) {
      const w = words[i]
      // « vingt et un », « soixante et onze »
      const joiner = w === 'et' && group.length > 0 && words[i + 1] !== undefined && ['un', 'une', 'onze'].includes(words[i + 1])
      if (!isNumberWord(w) && !joiner) break
      if (!joiner) group.push(w)
      i++
    }
    const compound = group.some((w) => !(w in DIGIT_WORDS))
    out.push(compound ? String(compoundValue(group)) : group.map((w) => DIGIT_WORDS[w]).join(''))
  }
  return out
}

/**
 * Sépare lettres et chiffres puis regroupe les chiffres consécutifs en un seul nombre :
 * « W41 » → w 41, « 1 1 0 » → 110. Un nombre compte ainsi pour un seul mot.
 */
function splitAlphanumeric(words: string[]): string[] {
  const out: string[] = []
  for (const part of words.flatMap((w) => w.match(/[a-z]+|\d+/g) || [])) {
    const last = out[out.length - 1]
    if (/^\d+$/.test(part) && last !== undefined && /^\d+$/.test(last)) out[out.length - 1] = last + part
    else out.push(part)
  }
  return out
}

/**
 * Normalise un texte pour comparaison tolérante :
 * - retire les accents
 * - passe en minuscules
 * - transforme underscores/tirets (séparateurs phonétiques, ex. Q_N_H) en espaces
 * - supprime la ponctuation
 * - réduit les espaces multiples
 */
export function normalizeText(input: string): string {
  return input
    .replace(/(\d)[.,](\d)/g, '$1 decimale $2') // 118.7 → 118 décimale 7
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Regroupe les suites de lettres isolées en un seul mot :
 * ['q','n','h'] → ['qnh'], ['f','e','p'] → ['fep'].
 * Une lettre isolée seule reste inchangée.
 */
function collapseSpelledLetters(tokens: string[]): string[] {
  const out: string[] = []
  let buffer: string[] = []
  const flush = () => {
    if (buffer.length > 1) out.push(buffer.join(''))
    else if (buffer.length === 1) out.push(buffer[0])
    buffer = []
  }
  for (const t of tokens) {
    if (/^[a-z]$/.test(t)) {
      buffer.push(t)
    } else {
      flush()
      out.push(t)
    }
  }
  flush()
  return out
}

/**
 * Découpe un texte en mots normalisés : alphabet OACI mappé, nombres en chiffres
 * comparés un par un, lettres épelées regroupées.
 */
export function tokenize(input: string, { collapse = true } = {}): string[] {
  const norm = normalizeText(input)
  const words = (norm ? norm.split(' ') : []).map((w) => (w === 'decimal' ? 'decimale' : OACI_ALPHABET[w] || w))
  const tokens = splitAlphanumeric(wordsToNumbers(words))
  return collapse ? collapseSpelledLetters(tokens) : tokens
}

/** Retire les notes pédagogiques {…} (non prononcées) du texte attendu. */
export function stripNotes(text: string): string {
  return text.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Texte réellement exigé du pilote : sans notes {…} ni segments entre parenthèses.
 * Les parenthèses marquent une valeur d'exemple ou un segment optionnel : toute autre valeur est valide.
 */
export function requiredText(text: string): string {
  return stripNotes(text).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
}

interface EquivGroup {
  canon: string
  variants: string[][]
}

/** Prépare les groupes d'équivalence (ex. callsign complet ≡ abrégé). */
function buildGroups(equivalences?: string[][]): EquivGroup[] {
  if (!equivalences) return []
  return equivalences
    .map((phrases, i) => ({
      canon: `§eq${i}`,
      // variantes les plus longues en premier pour un remplacement gourmand
      variants: phrases.map((p) => tokenize(p)).filter((v) => v.length).sort((a, b) => b.length - a.length),
    }))
    .filter((g) => g.variants.length)
}

/** Remplace toute occurrence d'une variante d'équivalence par un jeton canonique. */
function applyEquivalences(tokens: string[], groups: EquivGroup[]): string[] {
  if (!groups.length) return tokens
  const out: string[] = []
  let i = 0
  while (i < tokens.length) {
    let matched = false
    for (const g of groups) {
      for (const v of g.variants) {
        if (i + v.length <= tokens.length && v.every((t, k) => tokens[i + k] === t)) {
          out.push(g.canon)
          i += v.length
          matched = true
          break
        }
      }
      if (matched) break
    }
    if (!matched) {
      out.push(tokens[i])
      i++
    }
  }
  return out
}

/** Nombre de mots communs entre deux multiensembles de tokens. */
function multisetMatch(a: string[], b: string[]): number {
  const counts = new Map<string, number>()
  for (const t of a) counts.set(t, (counts.get(t) || 0) + 1)
  let match = 0
  for (const t of b) {
    const c = counts.get(t) || 0
    if (c > 0) {
      match++
      counts.set(t, c - 1)
    }
  }
  return match
}

/** Rappel et précision au niveau des mots entre attendu et réponse. */
export function tokenStats(
  expected: string,
  user: string,
  equivalences?: string[][]
): { recall: number; precision: number } {
  const groups = buildGroups(equivalences)
  const e = applyEquivalences(tokenize(expected), groups)
  const u = applyEquivalences(tokenize(user), groups)
  if (!e.length && !u.length) return { recall: 1, precision: 1 }
  if (!e.length || !u.length) return { recall: 0, precision: 0 }
  const match = multisetMatch(e, u)
  return { recall: match / e.length, precision: match / u.length }
}

/**
 * Similarité « accessoire » 0-100, orientée rappel :
 * avoir dit l'essentiel (rappel) pèse plus que les mots en trop (précision).
 */
export function tokenSimilarity(expected: string, user: string, equivalences?: string[][]): number {
  const { recall, precision } = tokenStats(expected, user, equivalences)
  return Math.round((recall * 0.7 + precision * 0.3) * 100)
}

/**
 * Note une réponse pilote face au texte attendu.
 * @param userText réponse tapée par l'utilisateur
 * @param expectedSpoken texte attendu (rendu, sans notes {…})
 * @param criticals éléments critiques à retrouver tels quels
 * @param equivalences groupes de formulations équivalentes (ex. callsign complet/abrégé)
 */
export function scoreAnswer(
  userText: string,
  expectedSpoken: string,
  criticals: Critical[],
  equivalences?: string[][]
): QuizResult {
  const groups = buildGroups(equivalences)
  const accessory = tokenSimilarity(expectedSpoken, userText, equivalences)

  // Deux formes : lettres épelées regroupées ou non. Sans la seconde, une lettre critique
  // (information C) collée à l'indicatif épelé qui suit (F E P) deviendrait « cfep ».
  const forms = [true, false].map((collapse) => ({
    user: ` ${applyEquivalences(tokenize(userText, { collapse }), groups).join(' ')} `,
    tokenizeValue: (v: string) => applyEquivalences(tokenize(v, { collapse }), groups).join(' '),
  }))
  const criticalResults: CriticalResult[] = criticals.map((c) => ({
    ...c,
    ok: forms.some(({ user, tokenizeValue }) => {
      const value = tokenizeValue(c.value)
      return value.length > 0 && user.includes(` ${value} `)
    }),
  }))

  const allCriticalsOk = criticalResults.every((c) => c.ok)
  const total = criticalResults.length
  const criticalScore = total
    ? (criticalResults.filter((c) => c.ok).length / total) * 100
    : null

  // Les critiques comptent pour moitié quand il y en a
  const score =
    criticalScore === null
      ? accessory
      : Math.round(0.5 * criticalScore + 0.5 * accessory)

  return {
    score,
    accessory,
    criticals: criticalResults,
    passed: allCriticalsOk && score >= PASS_THRESHOLD,
  }
}
