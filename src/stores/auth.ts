import { defineStore } from 'pinia';
import { post } from '../utils/api';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface AuthState {
  token: string | null;
  tokenType: string | null;
  expiresAt: number | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    tokenType: null,
    expiresAt: null,
    isLoading: false,
    error: null,
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token && state.expiresAt && state.expiresAt > Date.now(),
    authHeader: (state) => {
      if (state.token && state.tokenType) {
        return `${state.tokenType} ${state.token}`;
      }
      return null;
    },
  },
  
  actions: {
    /**
     * Authenticate with the IVAO API using client credentials
     */
    async authenticate() {
      // Clear any previous authentication state
      this.clearAuth();
      
      this.isLoading = true;
      this.error = null;
      
      try {
        const clientId = import.meta.env.VITE_IVAO_CLIENT_ID || '';
        const clientSecret = import.meta.env.VITE_IVAO_CLIENT_SECRET || '';
        
        if (!clientId || !clientSecret) {
          throw new Error('IVAO client credentials are not configured');
        }
        
        const response = await post<TokenResponse>(
          '/api/ivao/v2/oauth/token',
          {
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
          }
        );
        
        // Store the token details
        this.token = response.access_token;
        this.tokenType = response.token_type;
        
        // Calculate token expiration time (subtract 60 seconds as a buffer)
        const expiresInMs = (response.expires_in - 60) * 1000;
        this.expiresAt = Date.now() + expiresInMs;
        
        return true;
      } catch (error) {
        console.error('Authentication failed:', error);
        this.error = error instanceof Error ? error.message : 'Authentication failed';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Ensure a valid token is available, refreshing if necessary
     */
    async ensureAuthenticated() {
      // If token is missing or expired, get a new one
      if (!this.isAuthenticated) {
        return this.authenticate();
      }
      return true;
    },
    
    /**
     * Clear authentication state
     */
    clearAuth() {
      this.token = null;
      this.tokenType = null;
      this.expiresAt = null;
      this.error = null;
    },
  },
});
