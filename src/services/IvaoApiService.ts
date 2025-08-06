import { ApiService } from './ApiService';

/**
 * Service for interacting with the IVAO API
 */
export class IvaoApiService extends ApiService {
  /**
   * Creates a new instance of the IVAO API service
   */
  constructor() {
    super('/api/ivao/v2');
  }
  
  /**
   * Example method: Get user profile
   * Replace with actual IVAO API endpoints and response types
   */
  async getUserProfile(userId: string) {
    return this.getAuthenticated<any>(`/users/${userId}`);
  }
  
  /**
   * Example method: Get airports
   * Replace with actual IVAO API endpoints and response types
   */
  async getAirports(icao?: string) {
    const endpoint = icao ? `/airports/${icao}` : '/airports';
    return this.getAuthenticated<any>(endpoint);
  }
  
  /**
   * Example method: Get weather (METAR)
   * Replace with actual IVAO API endpoints and response types
   */
  async getMetar(icao: string) {
    return this.getAuthenticated<any>(`/weather/metar/${icao}`);
  }
  
  /**
   * Example method: Get weather (TAF)
   * Replace with actual IVAO API endpoints and response types
   */
  async getTaf(icao: string) {
    return this.getAuthenticated<any>(`/weather/taf/${icao}`);
  }
  
  /**
   * Example method: Get flights
   * Replace with actual IVAO API endpoints and response types
   */
  async getFlights(params?: { 
    airportDep?: string; 
    airportArr?: string;
    callsign?: string;
  }) {
    let endpoint = '/flights';
    
    if (params) {
      const queryParams = [];
      if (params.airportDep) queryParams.push(`departure=${params.airportDep}`);
      if (params.airportArr) queryParams.push(`arrival=${params.airportArr}`);
      if (params.callsign) queryParams.push(`callsign=${params.callsign}`);
      
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
    }
    
    return this.getAuthenticated<any>(endpoint);
  }
}

// Create and export a singleton instance
export const ivaoApi = new IvaoApiService();
