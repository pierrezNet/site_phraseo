/**
 * Utilitaires pour formater les données météorologiques
 */

/**
 * Options pour le formattage météo
 */
export interface WeatherFormatOptions {
  lang: 'fr' | 'en';
}

/**
 * Formatage des données météo à partir d'un objet METAR
 * @param metarData Les données METAR
 * @param options Options de formatage
 */
export function formatMetarData(metarData: any, options: WeatherFormatOptions = { lang: 'fr' }): string {
  if (!metarData || !metarData.decoded) {
    return options.lang === 'fr' 
      ? 'Données météo non disponibles' 
      : 'Weather data not available';
  }

  const { decoded } = metarData;
  
  // Extraction des valeurs
  const windDirection = decoded.wind?.direction || 0;
  const windSpeed = decoded.wind?.speed || 0;
  const visibility = typeof decoded.visibility === 'string' 
    ? parseInt(decoded.visibility, 10) / 1000 // Conversion en km si c'est en mètres
    : decoded.visibility || 0;
  const temperature = decoded.temperature || 0;
  const qnh = decoded.altimeter || 0;
  
  // Formatage de la visibilité (cas spécial pour 9999)
  let visibilityText;
  if (decoded.visibility === '9999' || visibility >= 10) {
    visibilityText = options.lang === 'fr' ? 'supérieure à 10 km' : 'greater than 10 km';
  } else {
    visibilityText = options.lang === 'fr' ? `${visibility} km` : `${visibility} km`;
  }
  
  // Formatage selon la langue
  if (options.lang === 'fr') {
    return `vent ${windDirection} degrés ${windSpeed} noeuds, visibilité ${visibilityText}, température ${temperature}, Q_N_H ${qnh}`;
  } else {
    return `wind ${windDirection} degrees ${windSpeed} knots, visibility ${visibilityText}, temperature ${temperature}, QNH ${qnh}`;
  }
}

/**
 * Remplace le tag [MET] dans un texte par les données météo formatées
 * @param text Texte contenant le tag [MET]
 * @param metarData Données METAR
 * @param options Options de formatage
 */
export function replaceMetarTag(text: string, metarData: any, options: WeatherFormatOptions = { lang: 'fr' }): string {
  if (!text.includes('[MET]')) {
    return text;
  }
  
  const formattedMetar = formatMetarData(metarData, options);
  return text.replace(/\[MET\]/g, formattedMetar);
}
