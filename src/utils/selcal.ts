/**
 * Code SELCAL : validation, épellation OACI et bitonalités, repris du générateur d'aeronautique.xyz
 * (selcal/selcal-commun.js) : mêmes 16 tonalités, mêmes règles, même séquence.
 */
import { OACI_WORDS } from './speech';

/** 16 tonalités (A à S sans I, N, O), alignées avec leurs fréquences en Hz */
export const SELCAL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S'] as const;
const FREQUENCIES = [312.6, 346.7, 384.6, 426.6, 473.2, 524.8, 582.1, 645.7, 716.1, 794.3, 881.0, 977.2, 1083.9, 1202.3, 1333.5, 1479.1];

/** Code par défaut (exemple de l'échange avec Gander Radio) */
export const DEFAULT_SELCAL = 'AD-RS';

export interface SelcalCheck {
  valid: boolean;
  /** Lettres du code (majuscules, sans séparateur) */
  letters: string[];
  /** Pourquoi le code est refusé */
  reasons: string[];
}

/**
 * Valide un code saisi (« AD-RS », « adrs »…) : 4 lettres distinctes parmi les 16 tonalités,
 * ordre alphabétique strict dans chaque paire, aucune contrainte entre les paires.
 */
export function checkSelcal(input: string): SelcalCheck {
  const letters = (input ?? '').toUpperCase().replace(/[^A-Z]/g, '').split('');
  const reasons: string[] = [];
  if (letters.length !== 4) reasons.push('Le code doit comporter 4 lettres.');
  const indices = letters.map((l) => (SELCAL_LETTERS as readonly string[]).indexOf(l));
  letters.forEach((l, i) => {
    if (indices[i] === -1) reasons.push(`La lettre « ${l} » n'est pas une tonalité SELCAL (A à S, sans I, N ni O).`);
  });
  if (letters.length === 4 && indices.every((i) => i !== -1)) {
    if (new Set(letters).size !== 4) reasons.push('Les 4 lettres doivent être différentes.');
    if (indices[0] >= indices[1]) reasons.push('Dans la 1re paire, la 1re lettre doit précéder la 2e (ordre alphabétique).');
    if (indices[2] >= indices[3]) reasons.push('Dans la 2e paire, la 1re lettre doit précéder la 2e (ordre alphabétique).');
  }
  return { valid: reasons.length === 0, letters, reasons };
}

/** Format officiel : « AD-RS » */
export const formatSelcal = (letters: string[]): string => `${letters.slice(0, 2).join('')}-${letters.slice(2).join('')}`;

/** Code épelé en alphabet OACI : « Alpha-Delta-Romeo-Sierra » ; saisie invalide → code par défaut */
export function spellSelcal(input: string): string {
  const { valid, letters } = checkSelcal(input);
  const code = valid ? letters : checkSelcal(DEFAULT_SELCAL).letters;
  return code.map((l) => (l === 'A' ? 'Alpha' : OACI_WORDS[l])).join('-');
}

let context: AudioContext | null = null;
let oscillators: OscillatorNode[] = [];
let pending: { timer: ReturnType<typeof setTimeout>; done: () => void } | null = null;

/** Arrête les bitonalités en cours (la promesse de playSelcal se résout) */
export function stopSelcal(): void {
  oscillators.forEach((o) => {
    try {
      o.stop();
    } catch {
      // déjà arrêté
    }
  });
  oscillators = [];
  if (pending) {
    clearTimeout(pending.timer);
    pending.done();
    pending = null;
  }
}

/** Joue les deux bitonalités d'un code valide : 0 → 1 s, pause, 1,2 → 2,2 s. Rien si le code est invalide. */
export async function playSelcal(input: string): Promise<void> {
  const { valid, letters } = checkSelcal(input);
  if (!valid) return;
  stopSelcal();
  context ??= new AudioContext();
  if (context.state === 'suspended') await context.resume();
  const ctx = context;
  const freq = (l: string) => FREQUENCIES[(SELCAL_LETTERS as readonly string[]).indexOf(l)];
  const start = ctx.currentTime + 0.05;
  const pair = (f1: number, f2: number, at: number) =>
    [f1, f2].forEach((f) => {
      const osc = new OscillatorNode(ctx, { frequency: f });
      const gain = new GainNode(ctx, { gain: 0.1 });
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + at);
      osc.stop(start + at + 1);
      oscillators.push(osc);
    });
  pair(freq(letters[0]), freq(letters[1]), 0);
  pair(freq(letters[2]), freq(letters[3]), 1.2);
  return new Promise((resolve) => {
    const done = () => {
      oscillators = [];
      resolve();
    };
    pending = { timer: setTimeout(() => { pending = null; done(); }, 2300), done };
  });
}
