import { get, post } from '../utils/api';
import { useAuthStore } from '../stores/auth';

/**
 * Base API service class that can be extended for specific API services
 */
export class ApiService {
  protected baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }
  
  /**
   * Makes an authenticated GET request to the API
   * @param endpoint The API endpoint
   * @param options Additional request options
   * @returns The response data
   */
  protected async getAuthenticated<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    const authStore = useAuthStore();
    await authStore.ensureAuthenticated();
    
    const authHeader = authStore.authHeader;
    if (!authHeader) {
      throw new Error('Not authenticated');
    }
    
    return get<T>(
      this.resolveUrl(endpoint),
      {
        ...options,
        headers: {
          ...options.headers,
          Authorization: authHeader,
        },
      }
    );
  }
  
  /**
   * Makes an authenticated POST request to the API
   * @param endpoint The API endpoint
   * @param data The data to send
   * @param options Additional request options
   * @returns The response data
   */
  protected async postAuthenticated<T>(
    endpoint: string,
    data: any,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    const authStore = useAuthStore();
    await authStore.ensureAuthenticated();
    
    const authHeader = authStore.authHeader;
    if (!authHeader) {
      throw new Error('Not authenticated');
    }
    
    return post<T>(
      this.resolveUrl(endpoint),
      data,
      {
        ...options,
        headers: {
          ...options.headers,
          Authorization: authHeader,
        },
      }
    );
  }
  
  /**
   * Makes a GET request to the API without authentication
   * @param endpoint The API endpoint
   * @param options Additional request options
   * @returns The response data
   */
  protected async get<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    return get<T>(this.resolveUrl(endpoint), options);
  }
  
  /**
   * Makes a POST request to the API without authentication
   * @param endpoint The API endpoint
   * @param data The data to send
   * @param options Additional request options
   * @returns The response data
   */
  protected async post<T>(
    endpoint: string,
    data: any,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    return post<T>(this.resolveUrl(endpoint), data, options);
  }
  
  /**
   * Resolves a URL from an endpoint
   * @param endpoint The endpoint to resolve
   * @returns The resolved URL
   */
  private resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${formattedEndpoint}`;
  }
}
