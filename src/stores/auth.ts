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
  }
});
