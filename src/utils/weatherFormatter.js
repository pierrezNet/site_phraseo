/**
 * Utilitaire de formatage des données météorologiques
 */

/**
 * Alphabet militaire pour l'épellation des lettres
 */
const MILITARY_ALPHABET = {
  'A': 'Alpha',
  'B': 'Bravo',
  'C': 'Charlie',
  'D': 'Delta',
  'E': 'Echo',
  'F': 'Foxtrot',
  'G': 'Golf',
  'H': 'Hotel',
  'I': 'India',
  'J': 'Juliet',
  'K': 'Kilo',
  'L': 'Lima',
  'M': 'Mike',
  'N': 'November',
  'O': 'Oscar',
  'P': 'Papa',
  'Q': 'Quebec',
  'R': 'Romeo',
  'S': 'Sierra',
  'T': 'Tango',
  'U': 'Uniform',
  'V': 'Victor',
  'W': 'Whiskey',
  'X': 'X-ray',
  'Y': 'Yankee',
  'Z': 'Zulu'
};

/**
 * Formate du texte pour respecter les conventions d'épellation
 * @param {string} text Le texte à formatter
 * @returns {string} Le texte formaté
 */
export function formatTextForAviationSpeech(text) {
  if (!text) return text;
  // 1) lettres seules & combos lettre-chiffres
  let step1 = text.replace(/(?<!\w)[A-Z](?!\w)|\b[A-Z][0-9]+\b/g, match => {
    if (/^[A-Z][0-9]+$/.test(match)) {
      return `${MILITARY_ALPHABET[match[0]]} ${match.slice(1)}`;
    }
    return MILITARY_ALPHABET[match] || match;
  });
  // 2) acronymes ≥2 lettres
  return step1.replace(/\b[A-Z]{2,}\b/g, ac => ac.split('').map(c=>c+'.').join(' '));
}

/**
 * Formate les données METAR pour l'affichage/synthèse vocale
 * @param {string} tag Le tag à remplacer (normalement '[MET]')
 * @param {Object} metar Les données METAR
 * @param {Object} options Options de formatage
 * @returns {string} Le texte formaté
 */
export function replaceMetarTag(tag, metar, options = {}) {
  const lang = options.lang || 'fr';
  const forSpeech = options.forSpeech || false;
  
  if (!metar) {
    return lang === 'fr' ? 'données météo non disponibles' : 'weather data not available';
  }
  
  try {
    // Formatage du vent
    let windText = '';
    if (metar.wind) {
      const direction = metar.wind.direction;
      const speed = metar.wind.speed;
      
      if (lang === 'fr') {
        windText = `vent ${direction} degrés ${speed} noeuds`;
      } else {
        windText = `wind ${direction} degrees ${speed} knots`;
      }
    }
    
    // Formatage de la visibilité
    let visibilityText = '';
    if (metar.visibility) {
      const distance = metar.visibility.distance;
      
      if (distance === 9999 || distance > 9000) {
        // Visibilité supérieure à 10km
        visibilityText = lang === 'fr' ? 'visibilité supérieure à 10 km' : 'visibility above 10 km';
      } else {
        // Visibilité normale
        const distanceKm = Math.round(distance / 1000);
        visibilityText = lang === 'fr' ? `visibilité ${distanceKm} km` : `visibility ${distanceKm} km`;
      }
    }
    
    // Formatage de la température
    let tempText = '';
    if (metar.temperature !== undefined) {
      tempText = lang === 'fr' ? `température ${metar.temperature}` : `temperature ${metar.temperature}`;
    }
    
    // Formatage du QNH
    let qnhText = '';
    if (metar.qnh) {
      const qnhValue = metar.qnh.toString();
      // QNH sera épelé lettre par lettre par la fonction formatTextForAviationSpeech
      qnhText = lang === 'fr' ? `QNH ${qnhValue}` : `QNH ${qnhValue}`;
    }
    
    // Assemblage du texte final
    const parts = [windText, visibilityText, tempText, qnhText].filter(Boolean);
    let result = parts.join(', ');
    
    // Si c'est pour la synthèse vocale, appliquer les règles d'épellation
    if (forSpeech) {
      result = formatTextForAviationSpeech(result);
    }
    
    return result;
  } catch (err) {
    console.error('Erreur lors du formatage des données météo:', err);
    return lang === 'fr' ? 'erreur lors du formatage des données météo' : 'error formatting weather data';
  }
}
