import type { Language } from '../stores/form';
import type { useFormStore } from '../stores/form';
import type { useWeatherStore } from '../stores/weather';
import { replaceMetarTag } from './weatherFormatter';

type FormStoreType = ReturnType<typeof useFormStore>;
type WeatherStoreType = ReturnType<typeof useWeatherStore>;

export const POL_STRINGS: Record<'matin' | 'soir', Record<Language, string>> = {
  matin: { fr: 'bonjour', en: 'hello' },
  soir: { fr: 'bonsoir', en: 'good evening' }
};

export const STATION_HIERARCHY = ['NDEL', 'NGND', 'NTWR', 'NAPP', 'NCTR', 'NUNI'] as const;

export const FREQUENCY_TO_STATION: Record<string, string> = {
  DEL: 'NDEL',
  GND: 'NGND',
  TWR: 'NTWR',
  APP: 'NAPP',
  CTR: 'NCTR'
};

export function getHeure(): 'matin' | 'soir' {
  return new Date().getHours() < 19 ? 'matin' : 'soir';
}

/**
 * Résout le label + fréquence d'une station radio avec fallback vers la station supérieure.
 */
export function resolveStation(
  freqType: string,
  lang: Language,
  formStore: FormStoreType
): string {
  const freq = formStore.form[freqType];
  const stationKey = FREQUENCY_TO_STATION[freqType];

  if (freq && freq.trim() !== '') {
    const label = formStore.frequencyLabels[stationKey]?.[lang] || freqType;
    return `${label}, ${formStore.formatFrequency(freq, lang)}`;
  }

  // Fallback : cherche la prochaine station disponible dans la hiérarchie
  const startIndex = STATION_HIERARCHY.indexOf(stationKey as typeof STATION_HIERARCHY[number]);
  if (startIndex !== -1) {
    for (let i = startIndex; i < STATION_HIERARCHY.length; i++) {
      const station = STATION_HIERARCHY[i];
      const fType = Object.keys(FREQUENCY_TO_STATION).find(k => FREQUENCY_TO_STATION[k] === station);
      if (fType) {
        const val = formStore.form[fType];
        if (typeof val === 'string' && val.trim() !== '') {
          const label = formStore.frequencyLabels[station]?.[lang] || station;
          return `${label}, ${formStore.formatFrequency(val, lang)}`;
        }
      }
    }
  }

  return formStore.frequencyLabels[stationKey]?.[lang] || freqType;
}

/**
 * Remplace tous les placeholders [TAG] d'un texte de phraséologie.
 */
export function replacePlaceholders(
  text: string,
  lang: Language,
  formStore: FormStoreType,
  weatherStore: WeatherStoreType
): string {
  const now = new Date();
  const currentHour = `${now.getUTCHours().toString().padStart(2, '0')} heures ${now.getMinutes().toString().padStart(2, '0')}`;

  return text.replace(/\[([^\]]+)\]/g, (_match, p1: string) => {
    switch (p1) {
      case 'POL':
        return POL_STRINGS[getHeure()][lang];
      case 'HOU':
        return currentHour;
      case 'CAA':
        return formStore.form.CAA || 'Station';
      case 'RWY':
        return formStore.formatRunway(formStore.form.RWY, lang);
      case 'MET':
        if (weatherStore.loading) return lang === 'fr' ? 'chargement...' : 'loading...';
        if (weatherStore.metarData) return replaceMetarTag('[MET]', weatherStore.metarData, { lang });
        return lang === 'fr' ? 'vent 240/05...' : 'wind 240/05...';
      case 'DEL':
      case 'GND':
      case 'TWR':
      case 'APP':
      case 'CTR':
        return resolveStation(p1, lang, formStore);
      case 'NDEL':
      case 'NGND':
      case 'NTWR':
      case 'NAPP':
      case 'NCTR':
        return formStore.frequencyLabels[p1]?.[lang] || p1;
      default:
        return formStore.form[p1] || _match;
    }
  });
}