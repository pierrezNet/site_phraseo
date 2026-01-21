// utils/weatherFormatter.ts

export function formatMetarData(metarData: any, options: any = { lang: 'fr' }): string {
  // 1. Si metarData est null ou undefined
  if (!metarData) {
    return options.lang === 'fr' ? 'vent 240 degrés 5 noeuds, température 12, Q_N_H 1013' : 'wind 240 degrees 5 knots, temperature 12, QNH 1013';
  }

  // 2. On pointe directement sur les données (ton Proxy AVWX)
  // On gère le cas où les données sont à la racine (ton cas) ou dans .decoded
  const d = metarData.decoded || metarData;
  
  // 3. Extraction sécurisée avec valeurs par défaut
  const qnh = d.altimeter?.value || "1013";
  const temp = d.temperature?.value || "15";
  const windDir = d.wind_direction?.value || "variable";
  const windSpd = d.wind_speed?.value || "0";

  // 4. Retour de la phrase
  if (options.lang === 'fr') {
    return `vent ${windDir} degrés ${windSpd} noeuds, température ${temp}, Q_N_H ${qnh}`;
  } else {
    return `wind ${windDir} degrees ${windSpd} knots, temperature ${temp}, QNH ${qnh}`;
  }
}

export function replaceMetarTag(text: string, metarData: any, options: any = { lang: 'fr' }): string {
  if (!text || !text.includes('[MET]')) return text;
  const info = formatMetarData(metarData, options);
  return text.replace(/\[MET\]/g, info);
}