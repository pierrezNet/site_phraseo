// utils/weatherFormatter.ts

export function formatMetarData(metarData: any, options: any = { lang: 'fr' }): string {
  // 1. On pointe directement sur les données (ton Proxy AVWX)
  // On gère le cas où les données sont à la racine (ton cas) ou dans .decoded
  const d = metarData.decoded || metarData;
  
  // 2. Extraction sécurisée avec valeurs par défaut
  const qnh = d.altimeter?.value || "1013";
  const temp = d.temperature?.value || "15";
  const windDir = d.wind_direction?.value || "variable";
  const windSpd = d.wind_speed?.value || "0";
  const vis = d.visibility?.value;
  const visParts = vis ? (options.lang === 'fr' ? `visibilité ${vis >= 9999 ? 'supérieure à 10' : Math.round(vis / 1000)} kilomètres, ` : `visibility ${vis >= 9999 ? 'greater than 10' : Math.round(vis / 1000)} kilometres, `) : '';

  // 3. Retour de la phrase
  if (options.lang === 'fr') {
    return `vent ${windDir} degrés ${windSpd} noeuds, ${visParts}température ${temp}, Q_N_H ${qnh}`;
  } else {
    return `wind ${windDir} degrees ${windSpd} knots, ${visParts}temperature ${temp}, Q_N_H ${qnh}`;
  }
}

export function replaceMetarTag(text: string, metarData: any, options: any = { lang: 'fr' }): string {
  if (!text || !text.includes('[MET]')) return text;
  const info = formatMetarData(metarData, options);
  return text.replace(/\[MET\]/g, info);
}