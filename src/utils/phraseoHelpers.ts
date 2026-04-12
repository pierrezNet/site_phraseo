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

  // Heure différée : UTC + 20 minutes
  const deferred = new Date(now.getTime() + 20 * 60 * 1000);
  const dh = deferred.getUTCHours().toString().padStart(2, '0');
  const dm = deferred.getUTCMinutes().toString().padStart(2, '0');
  const hdiffFr = `${dh}_${dm}`;
  const hdiffEn = `${dh[0]}_${dh[1]}_${dm[0]}_${dm[1]}`;

  return text.replace(/\[([^\]]+)\]/g, (_match, p1: string) => {
    switch (p1) {
      case 'POL':
        return POL_STRINGS[getHeure()][lang];
      case 'HOU':
        return currentHour;
      case 'HDIFF':
        return lang === 'fr' ? hdiffFr : hdiffEn;
      case 'HDIFF5M': {
        const m5 = new Date(deferred.getTime() - 5 * 60 * 1000);
        return `${m5.getUTCHours().toString().padStart(2, '0')}${m5.getUTCMinutes().toString().padStart(2, '0')}`;
      }
      case 'HDIFF10P': {
        const p10 = new Date(deferred.getTime() + 10 * 60 * 1000);
        return `${p10.getUTCHours().toString().padStart(2, '0')}${p10.getUTCMinutes().toString().padStart(2, '0')}`;
      }
      case 'CAA':
        return formStore.form.CAA || 'Station';
      case 'RWY':
        return formStore.formatRunway(formStore.form.RWY, lang);
      case 'QNH': {
        const d = weatherStore.metarData?.decoded || weatherStore.metarData;
        const qnh = d?.altimeter?.value || formStore.form.QNH || '1013';
        return qnh;
      }
      case 'MET':
        if (weatherStore.loading) return lang === 'fr' ? 'chargement...' : 'loading...';
        if (weatherStore.metarData) return replaceMetarTag('[MET]', weatherStore.metarData, { lang });
        // Fallback statique si pas de METAR (API indisponible)
        return lang === 'fr'
          ? `vent (240) degrés (10) noeuds, visibilité (10) kilomètres, température (15), Q_N_H ${formStore.form.QNH || '1013'}`
          : `wind (2_4_0) degrees (1_0) knots, visibility (10) kilometres, temperature (1_5), Q_N_H ${formStore.form.QNH || '1013'}`;
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