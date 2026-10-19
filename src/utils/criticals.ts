/**
 * Éléments critiques d'une réplique (valeurs exigées à 100 %), partagés par le quiz
 * et le banc d'essai vocal (bench/voice).
 */
import type { useFormStore } from '../stores/form';
import type { useWeatherStore } from '../stores/weather';
import { oppositeRunway, resolveStationParts } from './phraseoHelpers';
import { checkSelcal, formatSelcal, spellSelcal } from './selcal';
import { CRITICAL_TAGS, type Critical } from './quizScoring';

type FormStoreType = ReturnType<typeof useFormStore>;
type WeatherStoreType = ReturnType<typeof useWeatherStore>;
type Lang = 'fr' | 'en';

/** Valeur concrète d'un tag critique dans la langue donnée. */
export function resolveCriticalValue(tag: string, lang: Lang, formStore: FormStoreType, weatherStore: WeatherStoreType): string {
  switch (tag) {
    case 'RWY':
      return formStore.formatRunway(formStore.form.RWY, lang);
    case 'SEL':
      return spellSelcal(formStore.form.SEL ?? '');
    case 'RWYO':
      return formStore.formatRunway(oppositeRunway(formStore.form.RWY), lang);
    case 'QNH':
      return weatherStore.metarQnh ?? formStore.form.QNH ?? '1013';
    case 'DEL':
    case 'GND':
    case 'TWR':
    case 'APP':
    case 'CTR': {
      // Fréquence seule (même repli de station que le texte affiché) ; ignorée si saisie invalide
      const { frequency } = resolveStationParts(tag, lang, formStore);
      return /\d/.test(frequency) ? frequency : '';
    }
    default:
      // ALT, NIV, CAP, VIT, SQU, STA, WPT, HLD, VOI, INF, CAL, CAA : valeur brute du formulaire
      return formStore.form[tag] || '';
  }
}

/**
 * Éléments critiques présents dans un texte source (avec ses tags).
 * Passer le texte déjà débarrassé de ses parties facultatives (requiredText).
 */
export function buildCriticals(rawText: string, lang: Lang, formStore: FormStoreType, weatherStore: WeatherStoreType): Critical[] {
  return Object.keys(CRITICAL_TAGS)
    .filter((tag) => rawText.includes(`[${tag}]`))
    .map((tag) => ({ label: CRITICAL_TAGS[tag], value: String(resolveCriticalValue(tag, lang, formStore, weatherStore) ?? '') }))
    .filter((c) => c.value.trim() !== '')
    // [CAL] et [CAA] dans la même réplique : un seul contrôle d'indicatif
    .filter((c, i, all) => all.findIndex((o) => o.label === c.label) === i);
}

/**
 * Immatriculation épelée lettre par lettre : « F-EPST » → « F E P S T »
 * (le tiret couperait sinon l'indicatif en « f » + « epst »).
 */
export function spelledRegistration(callsign: string): string[] {
  return /^[A-Z]{1,2}-?[A-Z]{2,4}$/i.test(callsign) ? [callsign.replace(/-/g, '').split('').join(' ')] : [];
}

/** Ajoute l'épellation des immatriculations à des groupes d'équivalences existants */
export function withSpelledRegistrations(groups: string[][]): string[][] {
  return groups.map((g) => [...new Set([...g, ...g.flatMap(spelledRegistration)])]);
}

/** Indicatif complet, abrégé et épelé interchangeables dans les réponses. */
export function callsignEquivalences(formStore: FormStoreType): string[][] {
  const caa = formStore.form.CAA?.trim() ?? '';
  const cal = formStore.form.CAL?.trim() ?? '';
  const forms = [...new Set([cal, caa, ...spelledRegistration(cal)].filter(Boolean))];
  return forms.length > 1 ? [forms] : [];
}

/** Code SELCAL épelé (« Alpha-Delta-Romeo-Sierra ») ou écrit (« AD-RS », « ADRS ») : interchangeables */
export function selcalEquivalences(formStore: FormStoreType): string[][] {
  const { valid, letters } = checkSelcal(formStore.form.SEL ?? '');
  return valid ? [[spellSelcal(formStore.form.SEL ?? ''), formatSelcal(letters), letters.join('')]] : [];
}
