/**
 * Service simulant les appels à l'API IVAO
 * Utilise les identifiants du fichier .env (IVAO_CLIENT_ID, IVAO_CLIENT_SECRET)
 */

class IvaoApiService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.clientId = import.meta.env.VITE_IVAO_CLIENT_ID || '029bd43b-187a-4eb3-b57d-3be41a38d7fe';
    this.clientSecret = import.meta.env.VITE_IVAO_CLIENT_SECRET || '1Zw8a2cgVgXCwWg5sM5YlikTEtydMKyI';
  }

  /**
   * Simule l'authentification OAuth2 avec les identifiants du fichier .env
   * @returns {Promise<string>} Le token d'accès
   */
  async authenticate() {
    console.log('Authentification à l\'API IVAO (mode mock)');
    console.log(`Utilisation des identifiants: ${this.clientId} / [SECRET]`);
    
    // En mode mock, on simule un token valide
    this.token = 'mock_token_' + Math.random().toString(36).substring(2, 15);
    this.tokenExpiry = Date.now() + 3600000; // 1 heure
    
    return this.token;
  }

  /**
   * Vérifie si le token est toujours valide
   * @returns {boolean} true si le token est valide
   */
  isTokenValid() {
    return this.token && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  /**
   * Récupère un token valide (en génère un nouveau si nécessaire)
   * @returns {Promise<string>} Le token d'accès
   */
  async getValidToken() {
    if (!this.isTokenValid()) {
      return this.authenticate();
    }
    return this.token;
  }

  /**
   * Récupère les données METAR pour un aéroport
   * @param {string} icao Code OACI de l'aéroport
   * @returns {Promise<Object>} Données METAR
   */
  async getMetar(icao) {
    await this.getValidToken();
    
    console.log(`Récupération des données METAR pour ${icao} (mode mock)`);
    
    // Données de test
    return {
      icao: icao,
      wind: {
        direction: 180,
        speed: 5,
        unit: 'kt'
      },
      visibility: {
        distance: 9999,
        unit: 'm'
      },
      temperature: 22,
      qnh: 1021
    };
  }
}

// Singleton pour accéder au service depuis n'importe où
export const mockIvaoApi = new IvaoApiService();
