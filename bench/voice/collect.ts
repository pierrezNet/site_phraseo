/**
 * Collecte des phrases candidates (navigateur) : rend les répliques pilote des scénarios
 * avec les stores de l'application, comme le fait le quiz.
 */
import { createPinia, setActivePinia } from 'pinia';
import { useFormStore, type FlightMode } from '../../src/stores/form';
import { useWeatherStore } from '../../src/stores/weather';
import { buildFlight, requirementsMet, type Scenario } from '../../src/utils/flight';
import { replacePlaceholders } from '../../src/utils/phraseoHelpers';
import { requiredText, stripNotes } from '../../src/utils/quizScoring';
import { buildCriticals, callsignEquivalences } from '../../src/utils/criticals';
import scenarios from '../../src/data/scenarios.json';
import phraseoVFR from '../../src/data/phraseologieVFR.json';
import phraseoIFR from '../../src/data/phraseologieIFR.json';
import { readable, type Candidate } from './phrases';

export function collectCandidates(): Candidate[] {
  setActivePinia(createPinia());
  const formStore = useFormStore();
  const weatherStore = useWeatherStore();
  formStore.initializeFormData();
  const originalMode = formStore.mode as FlightMode;

  const candidates: Candidate[] = [];
  for (const sc of scenarios as Scenario[]) {
    formStore.switchMode(sc.mode);
    const data = sc.mode === 'VFR' ? phraseoVFR : phraseoIFR;
    const overrides: Record<string, string> = sc.local ? { ARR: String(formStore.form.DEP ?? '') } : {};
    // Deux tirages (premières puis dernières variantes, imprévus compris) pour varier les phrases
    for (const rng of [() => 0, () => 0.99]) {
      for (const step of buildFlight(sc, data, 'intermédiaire', rng, formStore.isFrequencyOpen)) {
        for (const line of step.lines) {
          if (line._class !== 'Pilot' || !requirementsMet(line, formStore.isFrequencyOpen)) continue;
          const lang = line._lang as 'fr' | 'en';
          const processed = replacePlaceholders(line.__text, lang, formStore, weatherStore, overrides);
          candidates.push({
            lang,
            mode: sc.mode,
            scenario: sc.id,
            step: step.title,
            display: readable(stripNotes(processed)),
            expected: requiredText(processed),
            criticals: buildCriticals(requiredText(line.__text), lang, formStore, weatherStore),
            equivalences: callsignEquivalences(formStore),
          });
        }
      }
    }
  }
  // Le changement de mode est persisté : on rend l'application dans l'état trouvé
  formStore.switchMode(originalMode);
  return candidates;
}
