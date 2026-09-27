// utils/weatherFormatter.ts
import { metarFields, type Metar } from '../types/metar';

interface FormatOptions {
  lang: 'fr' | 'en';
}

export function formatMetarData(metarData: Metar, options: FormatOptions = { lang: 'fr' }): string {
  const d = metarFields(metarData);

  // Extraction sécurisée avec valeurs par défaut
  const qnh = d.altimeter?.value || "1013";
  const temp = d.temperature?.value || "15";
  const windDir = d.wind_direction?.value || "variable";
  const windSpd = d.wind_speed?.value || "0";
  const vis = Number(d.visibility?.value) || 0;
  const visKm = vis >= 9999 ? (options.lang === 'fr' ? 'supérieure à 10' : 'greater than 10') : Math.round(vis / 1000);
  const visParts = vis ? (options.lang === 'fr' ? `visibilité ${visKm} kilomètres, ` : `visibility ${visKm} kilometres, `) : '';

  if (options.lang === 'fr') {
    return `vent ${windDir} degrés ${windSpd} noeuds, ${visParts}température ${temp}, Q_N_H ${qnh}`;
  } else {
    return `wind ${windDir} degrees ${windSpd} knots, ${visParts}temperature ${temp}, Q_N_H ${qnh}`;
  }
}

export function replaceMetarTag(text: string, metarData: Metar, options: FormatOptions = { lang: 'fr' }): string {
  if (!text || !text.includes('[MET]')) return text;
  const info = formatMetarData(metarData, options);
  return text.replace(/\[MET\]/g, info);
}
