/**
 * Banc d'essai vocal : choix des phrases pilote à enregistrer, tirées des scénarios
 * du vol complet et rendues avec les paramètres de l'utilisateur.
 */
import type { Critical } from '../../src/utils/quizScoring';

export interface BenchPhrase {
  id: string;
  lang: 'fr' | 'en';
  mode: 'VFR' | 'IFR';
  scenario: string;
  step: string;
  /** Texte à lire à voix haute (notes retirées, épellations « Q_N_H » rendues lisibles) */
  display: string;
  /** Texte attendu pour la notation (sans notes ni parties facultatives) */
  expected: string;
  criticals: Critical[];
  /** Équivalences acceptées (indicatif complet ≡ abrégé) */
  equivalences: string[][];
}

export type Candidate = Omit<BenchPhrase, 'id'>;

/**
 * Sélectionne les phrases à enregistrer :
 * sans doublon, les plus riches en éléments critiques d'abord, en alternant VFR et IFR.
 */
export function pickPhrases(candidates: Candidate[], counts: { fr: number; en: number }): BenchPhrase[] {
  const picked: BenchPhrase[] = [];
  for (const lang of ['fr', 'en'] as const) {
    const seen = new Set<string>();
    const unique = candidates.filter((c) => {
      if (c.lang !== lang || !c.expected.trim() || seen.has(c.expected)) return false;
      seen.add(c.expected);
      return true;
    });
    const byRichness = (list: Candidate[]) => [...list].sort((a, b) => b.criticals.length - a.criticals.length);
    const vfr = byRichness(unique.filter((c) => c.mode === 'VFR'));
    const ifr = byRichness(unique.filter((c) => c.mode === 'IFR'));
    const chosen: Candidate[] = [];
    while (chosen.length < counts[lang] && (vfr.length || ifr.length)) {
      if (ifr.length) chosen.push(ifr.shift()!);
      if (vfr.length && chosen.length < counts[lang]) chosen.push(vfr.shift()!);
    }
    chosen.forEach((c, i) => picked.push({ ...c, id: `${lang}-${String(i + 1).padStart(2, '0')}` }));
  }
  return picked;
}

/** Texte lisible à voix haute : « Q_N_H » → « Q N H », parenthèses d'exemple retirées */
export function readable(text: string): string {
  return text.replace(/_/g, ' ').replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
}
