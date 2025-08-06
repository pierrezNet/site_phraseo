/**
 * Service mock pour simuler l'API IVAO
 * Utilisé pour tester et démontrer le système d'API sans dépendance externe
 */

// Réponses METAR simulées
const MOCK_METARS: Record<string, any> = {
  'LFPG': {
    icao: 'LFPG',
    name: 'Paris Charles de Gaulle',
    created_at: new Date().toISOString(),
    message: 'LFPG 101000Z 21008KT 180V240 9999 FEW035 SCT080 16/07 Q1024 NOSIG',
    decoded: {
      visibility: '9999',
      wind: {
        direction: 210,
        speed: 8,
        gust: null,
        variable_direction: {
          from: 180,
          to: 240
        }
      },
      temperature: 16,
      dew_point: 7,
      altimeter: 1024,
      clouds: [
        {
          type: 'FEW',
          altitude: 3500
        },
        {
          type: 'SCT',
          altitude: 8000
        }
      ]
    }
  },
  'LFPO': {
    icao: 'LFPO',
    name: 'Paris Orly',
    created_at: new Date().toISOString(),
    message: 'LFPO 101000Z 21007KT 9999 FEW040 SCT120 15/08 Q1024 NOSIG',
    decoded: {
      visibility: '9999',
      wind: {
        direction: 210,
        speed: 7,
        gust: null,
        variable_direction: null
      },
      temperature: 15,
      dew_point: 8,
      altimeter: 1024,
      clouds: [
        {
          type: 'FEW',
          altitude: 4000
        },
        {
          type: 'SCT',
          altitude: 12000
        }
      ]
    }
  },
  'LFMN': {
    icao: 'LFMN',
    name: 'Nice Côte d\'Azur',
    created_at: new Date().toISOString(),
    message: 'LFMN 101000Z 18005KT 9999 FEW030 SCT100 22/14 Q1021 NOSIG',
    decoded: {
      visibility: '9999',
      wind: {
        direction: 180,
        speed: 5,
        gust: null,
        variable_direction: null
      },
      temperature: 22,
      dew_point: 14,
      altimeter: 1021,
      clouds: [
        {
          type: 'FEW',
          altitude: 3000
        },
        {
          type: 'SCT',
          altitude: 10000
        }
      ]
    }
  }
};

/**
 * Mock service pour tester l'API IVAO
 */
export class MockIvaoApiService {
  /**
   * Simule l'obtention d'un METAR
   * @param icao Code ICAO de l'aéroport
   * @returns Données METAR simulées
   */
  async getMetar(icao: string): Promise<any> {
    // Simuler une latence réseau réaliste
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Convertir en majuscules pour la recherche
    const normalizedIcao = icao.toUpperCase();
    
    // Rechercher le METAR correspondant
    if (MOCK_METARS[normalizedIcao]) {
      return MOCK_METARS[normalizedIcao];
    }
    
    // Si le code ICAO n'est pas trouvé, retourner une erreur réaliste
    throw new Error(`METAR not found for ${icao}`);
  }
  
  /**
   * Simule l'obtention d'un TAF
   * @param icao Code ICAO de l'aéroport
   * @returns Données TAF simulées
   */
  async getTaf(icao: string): Promise<any> {
    // Simuler une latence réseau réaliste
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Pour simplifier, nous retournons toujours un TAF générique basé sur le METAR
    const normalizedIcao = icao.toUpperCase();
    
    if (MOCK_METARS[normalizedIcao]) {
      return {
        icao: normalizedIcao,
        name: MOCK_METARS[normalizedIcao].name,
        created_at: new Date().toISOString(),
        message: `TAF ${normalizedIcao} 101100Z 1012/1112 21010KT 9999 FEW040 SCT120 
          TEMPO 1015/1018 22015G25KT 8000 -SHRA BKN040 
          BECMG 1103/1105 20005KT CAVOK=`,
      };
    }
    
    throw new Error(`TAF not found for ${icao}`);
  }
}

// Créer et exporter une instance singleton
export const mockIvaoApi = new MockIvaoApiService();
