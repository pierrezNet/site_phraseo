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
  /** Exercice validé : essentiel dit (rappel suffisant) ET tous les critiques présents. */
  passed: boolean
}

/** Seuil de note globale au-delà duquel la réponse est acceptée. */
export const PASS_THRESHOLD = 75

/** Part minimale des mots attendus qu'il faut avoir dits pour valider. */
export const RECALL_MIN = 0.7

/** Tags de placeholders considérés comme critiques, avec leur libellé lisible. */
export const CRITICAL_TAGS: Record<string, string> = {
  QNH: 'QNH',
  RWY: 'Piste',
  ALT: 'Altitude',
  NIV: 'Niveau',
}

/** Alphabet aéronautique OACI → lettre (Lima = L, etc.). */
const OACI_ALPHABET: Record<string, string> = {
  alpha: 'a', bravo: 'b', charlie: 'c', delta: 'd', echo: 'e',
  foxtrot: 'f', golf: 'g', hotel: 'h', india: 'i', juliett: 'j', juliet: 'j',
  kilo: 'k', lima: 'l', mike: 'm', november: 'n', oscar: 'o', papa: 'p',
  quebec: 'q', romeo: 'r', sierra: 's', tango: 't', uniform: 'u',
  victor: 'v', whiskey: 'w', whisky: 'w', xray: 'x', yankee: 'y', zulu: 'z',
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

/** Découpe un texte en mots normalisés (alphabet OACI mappé, lettres épelées regroupées). */
export function tokenize(input: string): string[] {
  const norm = normalizeText(input)
  const words = (norm ? norm.split(' ') : []).map((w) => OACI_ALPHABET[w] || w)
  return collapseSpelledLetters(words)
}

/** Retire les notes pédagogiques {…} (non prononcées) du texte attendu. */
export function stripNotes(text: string): string {
  return text.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim()
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
      variants: phrases.map(tokenize).filter((v) => v.length).sort((a, b) => b.length - a.length),
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
  const { recall } = tokenStats(expectedSpoken, userText, equivalences)
  const accessory = tokenSimilarity(expectedSpoken, userText, equivalences)

  const userTokens = ` ${applyEquivalences(tokenize(userText), groups).join(' ')} `
  const criticalResults: CriticalResult[] = criticals.map((c) => {
    const value = applyEquivalences(tokenize(c.value), groups).join(' ')
    return { ...c, ok: value.length > 0 && userTokens.includes(` ${value} `) }
  })

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
    passed: allCriticalsOk && recall >= RECALL_MIN && score >= PASS_THRESHOLD,
  }
}
