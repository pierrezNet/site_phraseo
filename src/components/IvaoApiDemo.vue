<template>
  <div class="p-4 bg-gray-50 rounded-lg shadow">
    <h2 class="text-xl font-bold mb-4">IVAO API Connection Demo</h2>
    
    <!-- Mode switch -->
    <div class="mb-4 flex items-center">
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" v-model="useMockApi" class="sr-only peer">
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        <span class="ml-3 text-sm font-medium text-gray-700">
          {{ useMockApi ? 'Mode Mock (données simulées)' : 'Mode Réel (API IVAO)' }}
        </span>
      </label>
    </div>
    
    <!-- Authentication Status -->
    <div class="mb-4" v-if="!useMockApi">
      <div class="flex items-center mb-2">
        <div 
          class="w-3 h-3 rounded-full mr-2"
          :class="isAuthenticated ? 'bg-green-500' : 'bg-red-500'"
        ></div>
        <span class="font-medium">
          {{ isAuthenticated ? 'Authentifié' : 'Non Authentifié' }}
        </span>
      </div>
      
      <div v-if="authStore.error" class="text-red-500 text-sm mb-2">
        Erreur: {{ authStore.error }}
      </div>
      
      <button 
        @click="authenticate" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        :disabled="authStore.isLoading"
      >
        {{ authStore.isLoading ? 'Authentification...' : 'Authentifier' }}
      </button>
    </div>
    
    <!-- API Call Demo -->
    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-2">Exemple d'appel API</h3>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Code ICAO de l'aéroport:
        </label>
        <div class="flex">
          <input 
            v-model="icaoCode" 
            class="px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Entrez un code ICAO (ex: LFPG)"
          />
          <button 
            @click="fetchMetar" 
            class="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 disabled:opacity-50"
            :disabled="isLoading || (!isAuthenticated && !useMockApi)"
          >
            Obtenir METAR
          </button>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="text-gray-600">
        Chargement des données...
      </div>
      
      <!-- Error State -->
      <div v-if="error" class="text-red-500 text-sm mt-2 mb-2">
        <p class="font-semibold">Erreur:</p>
        <p>{{ error }}</p>
      </div>
      
      <!-- Debug Info -->
      <div class="mt-4 p-3 bg-gray-100 rounded text-xs">
        <details>
          <summary class="cursor-pointer font-medium text-blue-600">Informations de débogage</summary>
          <div class="mt-2">
            <p class="mb-1"><span class="font-medium">Mode:</span> {{ useMockApi ? 'Mock (données simulées)' : 'Réel (API IVAO)' }}</p>
            <template v-if="!useMockApi">
              <p class="mb-1"><span class="font-medium">Authentification:</span> {{ isAuthenticated ? 'OK' : 'Non' }}</p>
              <p class="mb-1"><span class="font-medium">Token:</span> {{ authStore.token ? (authStore.token.substring(0, 10) + '...') : 'Aucun' }}</p>
              <p class="mb-1"><span class="font-medium">Type de token:</span> {{ authStore.tokenType || 'N/A' }}</p>
              <p class="mb-1"><span class="font-medium">Expiration:</span> {{ authStore.expiresAt ? new Date(authStore.expiresAt).toLocaleString() : 'N/A' }}</p>
              <p class="mb-1"><span class="font-medium">URL API:</span> {{ `/api/ivao/v2/weather/metar/${icaoCode}` }}</p>
              <p class="mb-1"><span class="font-medium">Erreur d'authentification:</span> {{ authStore.error || 'Aucune' }}</p>
            </template>
            <template v-else>
              <p class="mb-1"><span class="font-medium">API utilisée:</span> Mock IVAO API</p>
              <p class="mb-1"><span class="font-medium">ICAO recherché:</span> {{ icaoCode }}</p>
              <p class="mb-1"><span class="font-medium">Codes disponibles:</span> LFPG, LFPO, LFMN</p>
            </template>
          </div>
        </details>
      </div>
      
      <!-- Language Selection -->
      <div class="mt-4 mb-2" v-if="result">
        <label class="block text-sm font-medium text-gray-700 mb-1">Langue:</label>
        <div class="flex space-x-4">
          <label class="inline-flex items-center">
            <input type="radio" v-model="language" value="fr" class="form-radio">
            <span class="ml-2">Français</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" v-model="language" value="en" class="form-radio">
            <span class="ml-2">English</span>
          </label>
        </div>
      </div>
      
      <!-- Tag Replacement Demo -->
      <div v-if="result" class="mt-4 border-t border-gray-200 pt-4">
        <h4 class="font-medium mb-2">Remplacement du tag [MET]:</h4>
        
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Texte avec tag [MET]:
          </label>
          <textarea
            v-model="sampleText"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
          ></textarea>
        </div>
        
        <div class="bg-white p-3 border border-gray-300 rounded">
          <h5 class="text-sm font-medium mb-1">Résultat:</h5>
          <p class="text-gray-800">{{ formattedText }}</p>
        </div>
      </div>
      
      <!-- Results -->
      <div v-if="result" class="mt-4">
        <h4 class="font-medium mb-2">METAR pour {{ result.icao }}:</h4>
        <div class="bg-gray-100 p-3 rounded overflow-x-auto">
          <pre class="text-sm">{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { ivaoApi } from '../services/IvaoApiService';
import { mockIvaoApi } from '../services/MockApiService';
import { replaceMetarTag } from '../utils/weatherFormatter';
import type { WeatherFormatOptions } from '../utils/weatherFormatter';

// Store
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const useMockApi = ref(false); // Option pour utiliser l'API mock

// State
const icaoCode = ref('LFPG'); // Default to Paris Charles de Gaulle
const isLoading = ref(false);
const error = ref<string | null>(null);
const result = ref<any>(null);
const language = ref<'fr' | 'en'>('fr');
const sampleText = ref('La météo actuelle est: [MET]');
const formattedText = computed(() => {
  if (result.value) {
    const options: WeatherFormatOptions = { lang: language.value };
    return replaceMetarTag(sampleText.value, result.value, options);
  }
  return sampleText.value;
});

// Methods
const authenticate = async () => {
  try {
    await authStore.authenticate();
    if (authStore.isAuthenticated) {
      console.log('Successfully authenticated with IVAO API');
    }
  } catch (err) {
    console.error('Failed to authenticate:', err);
  }
};

const fetchMetar = async () => {
  if (!icaoCode.value) {
    error.value = 'Veuillez entrer un code ICAO';
    return;
  }
  
  error.value = null;
  result.value = null;
  isLoading.value = true;
  
  try {
    if (useMockApi.value) {
      // Utiliser l'API mock pour les tests
      console.log('Utilisation de l\'API mock pour:', icaoCode.value);
      const data = await mockIvaoApi.getMetar(icaoCode.value);
      result.value = data;
      console.log('Réponse API mock:', data);
    } else {
      // Utiliser l'API IVAO réelle
      // Vérifier l'authentification
      if (!authStore.isAuthenticated) {
        console.log('Tentative d\'authentification automatique...');
        await authStore.authenticate();
      }
      
      console.log('En-tête d\'autorisation:', authStore.authHeader);
      console.log('URL de la requête:', `/api/ivao/v2/weather/metar/${icaoCode.value}`);
      
      // Faire la requête API
      const data = await ivaoApi.getMetar(icaoCode.value);
      result.value = data;
      console.log('Réponse API IVAO:', data);
    }
  } catch (err) {
    console.error('API request failed:', err);
    if (err instanceof Error) {
      error.value = `${err.name}: ${err.message}`;
      console.error('Stack trace:', err.stack);
    } else {
      error.value = 'Échec de la requête: erreur inconnue';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
