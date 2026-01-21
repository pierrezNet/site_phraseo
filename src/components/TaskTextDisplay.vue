<template>
    <div class="m-1 md:space-y-4 md:pr-6">
        <h2 class="hidden md:block custom-h2">Dialogues</h2>
        <div
          v-for="(text, index) in displayedTexts"
          :key="index"
          :class="[
            'w-full p-4 rounded-md py-2 mb-4 shadow transition',
            text._class === 'Pilot' ? 'bg-blue-100 border-l-4 border-blue-500' : 'bg-orange-100 border-l-4 border-orange-500'
          ]"
        >
        <span
          v-if="text.icon"
          v-html="text.icon"
          class="inline-block w-5 h-5 mr-2 align-middle"
        ></span>
          <span v-html="replacePlaceholders(text.__text)"></span>
        </div>
    </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { replaceMetarTag } from '../utils/weatherFormatter';

// Interface locale identique à celle d'App.vue pour la cohérence
interface PhraseoLine {
  _class: string;
  _lang: string;
  __text: string;
  _color?: string; // Optionnel, au cas où tu l'ajoutes au JSON
  icon?: string;   // Optionnel
}

const props = defineProps<{
  selectedTaskTexts: any[] // Reçoit maintenant le tableau 'para' brut
}>();

const formStore = useFormStore();
const langStore = useLangStore();

const displayedTexts = computed(() => {
  // Cette fonction s'exécute à chaque fois que langStore.current change !
  return props.selectedTaskTexts.filter(t => t._lang === langStore.current);
});

// Map des couleurs pour le template
const colorMap: Record<string, string> = {
  Pilot: 'bg-blue-200 hover:bg-blue-300', // On utilise les classes du JSON
  ATC: 'bg-orange-200 hover:bg-orange-300',
  info: 'bg-gray-200 hover:bg-gray-300',
  warning: 'bg-red-200 hover:bg-red-300'
};

// État pour les données METAR
const metarData = ref<any>(null);
const metarLoading = ref(false);
const metarError = ref<string | null>(null);
// Utiliser le code ICAO des paramètres avec LFPG comme valeur par défaut
const metarIcao = computed(() => formStore.form.MET || 'LFPG');

// Fonction pour transformer les notes entre accolades en infobulles
function processTooltips(text: string): string {
  return text.replace(/\{([^}]+)\}/g, (match, noteContent) => {
    const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    return `<span class="relative inline-block">
      <button 
        type="button"
        class="text-blue-400 underline decoration-dotted cursor-help focus:outline-none"
        onclick="this.nextElementSibling.classList.toggle('hidden')"
        onblur="setTimeout(() => this.nextElementSibling.classList.add('hidden'), 150)"
      >ℹ️</button>
      <div class="hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 w-max max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg break-words">
        <div class="whitespace-normal">${noteContent}</div>
        <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </span>`;
  });
}

// Ordre hiérarchique des stations selon frequencyLabels
const STATION_HIERARCHY = ['NDEL', 'NGND', 'NTWR', 'NAPP', 'NCTR', 'NUNI'];
const FREQUENCY_TO_STATION: Record<string, string> = {
  'DEL': 'NDEL',
  'GND': 'NGND', 
  'TWR': 'NTWR',
  'APP': 'NAPP',
  'CTR': 'NCTR'
};

// Fonction pour trouver la station de fallback avec une fréquence valide
function findFallbackStation(requestedStation: string, lang: 'fr' | 'en') {
  const startIndex = STATION_HIERARCHY.indexOf(requestedStation);
  if (startIndex === -1) return { station: requestedStation, label: requestedStation };

  // Parcourir la hiérarchie à partir de la station demandée
  for (let i = startIndex; i < STATION_HIERARCHY.length; i++) {
    const station = STATION_HIERARCHY[i];
    const frequencyType = Object.keys(FREQUENCY_TO_STATION).find(key => FREQUENCY_TO_STATION[key] === station);
    
    if (frequencyType && formStore.form[frequencyType] && formStore.form[frequencyType].trim() !== '') {
      const label = formStore.frequencyLabels[station]?.[lang] || station;
      return { 
        station, 
        label,
        frequency: formStore.form[frequencyType],
        frequencyType
      };
    }
  }

  // Si aucune fréquence n'est trouvée, retourner la station demandée sans fréquence
  const label = formStore.frequencyLabels[requestedStation]?.[lang] || requestedStation;
  return { station: requestedStation, label };
}

// Fonction pour remplacer les placeholders par des valeurs réalistes
function replacePlaceholders(text: string): string {
  const lang = langStore.current as 'fr' | 'en';
  
  // Obtenir l'heure actuelle pour le placeholder [HOU]
  const now = new Date();
  const currentHour = `${now.getUTCHours().toString().padStart(2, '0')} heures ${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Déterminer le moment de la journée pour [POL]
  const getHeure = (): 'matin' | 'soir' => {
    const dt = new Date();
    return dt.getHours() < 19 ? 'matin' : 'soir';
  };
  
  const POL: Record<'matin' | 'soir', Record<'fr' | 'en', string>> = {
    matin: { fr: "bonjour", en: "hello" },
    soir: { fr: "bonsoir", en: "good evening" }
  };
  
  // D'abord traiter les placeholders entre crochets
  let result = text.replace(/\[([^\]]+)\]/g, (match, p1) => {
    // Gestion des placeholders spéciaux
    switch(p1) {
      case 'POL':
        return POL[getHeure()][lang];
      case 'HOU':
        return currentHour;
      case 'MET':
        console.log("Balise MET trouvée dans TaskDisplay !"); 
        if (metarLoading.value) return lang === 'fr' ? 'chargement...' : 'loading...';
        // Utilisation de ton fichier weatherFormatter.ts
        return replaceMetarTag('[MET]', metarData.value, { lang: lang as 'fr' | 'en' });
      case 'CAA':
        return formStore.form.CAA || "Station";
      case 'RWY':
        return formStore.formatRunway(formStore.form.RWY, lang);
      case 'DEL':
      case 'GND':
      case 'TWR':
      case 'APP':
      case 'CTR': {
        const freq = formStore.form[p1];
        if (!freq || freq.trim() === '') {
          // Si pas de fréquence, utiliser le système de fallback
          const requestedStation = FREQUENCY_TO_STATION[p1];
          const fallback = findFallbackStation(requestedStation, lang);
          return fallback.frequency 
            ? `${fallback.label}, ${formStore.formatFrequency(fallback.frequency, lang)}`
            : fallback.label;
        }
        const stationKey = FREQUENCY_TO_STATION[p1];
        const label = formStore.frequencyLabels[stationKey]?.[lang] || p1;
        return `${label}, ${formStore.formatFrequency(freq, lang)}`;
      }
      case 'NDEL':
      case 'NGND':
      case 'NTWR':
      case 'NAPP':
      case 'NCTR': {
        // Pour les stations, on retourne uniquement le nom de la station sans la fréquence
        const stationLabel = formStore.frequencyLabels[p1]?.[lang] || p1;
        return stationLabel;
      }
      default:
        return formStore.form[p1] || match;
    }
  });
  
  // Ensuite traiter les notes entre accolades pour les transformer en infobulles
  result = processTooltips(result);
  
  return result;
}
</script>
  
<style scoped>
/* Ajoutez des styles spécifiques si nécessaire */
</style>
