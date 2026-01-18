<template>
  <div class="p-1 md:p-4" v-if="isReady">
    <!-- Onglets des phases de vol -->
    <div class="flex justify-between md:justify-start md:gap-2 mb-1 md:mb-5">
      <button
        v-for="(tab, i) in phaseTabs"
        :key="i"
        @click="selectedTab = tab.id"
        :class="[
          'flex items-center p-4 rounded-lg',
          selectedTab === tab.id
            ? 'bg-white border border-gray-300'
            : 'bg-gray-200 hover:bg-gray-300 border-0'
        ]"
      >
      <span
        v-html="tab.icon"
        class="inline-block w-5 h-5"
        :title="tab.label"
      ></span>
      </button>
    </div>

    <!-- Contenu des tâches par phase -->
    <div class="grid grid-cols-3 md:grid-cols-1 place-content-between gap-1">
      <button
        v-for="task in filteredPhaseTasks"
        :key="task._id"
        :class="[
          'md:w-full text-white rounded-md m-1 md:p-2 md:mb-2 shadow transition',
          selectedTaskIds.includes(task._id)
              ? `hover:bg-green-800 text-white bg-green-700`
              : `hover:bg-${task._color}-800 bg-${task._color}-700`
          ]"
        @click="logTask(task)"
      >
        <span class="hidden md:inline">{{ task._name }}</span>
        <span class="inline md:hidden">{{ task._short }}</span> 
        <span v-if="selectedTaskIds.includes(task._id)" class="float-right text-white mr-2">✓</span>
      </button>
    </div>
 
    <hr v-if="selectedSubgraphs.length > 0" class="md:hidden border border-blue-800 mt-1 mb-1"/>
    <!-- Boutons correspondants aux subgraph -->
    <div v-if="selectedSubgraphs.length > 0" class="grid grid-cols-3 md:grid-cols-1 place-content-between gap-1">
      <h2 class="custom-h2">Options</h2>
      <button
        v-for="subgraph in selectedSubgraphs"
        :key="subgraph.refid"
        :class="[
          'w-full text-white rounded-md m-1 md:p-2 md:mb-2 shadow transition',
          selectedTaskIds.includes(subgraph.refid)
            ? `hover:bg-green-800 text-white bg-green-700`
            : `bg-orange-700 hover:bg-orange-800`
        ]"
          @click="logSubgraphTask(subgraph)"
      >
        <span class="hidden md:inline">{{ subgraph._name }}</span>
        <span class="inline md:hidden">{{ subgraph._short }}</span>
        <span v-if="selectedTaskIds.includes(subgraph.refid)" class="float-right text-white mr-2">✓</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useLangStore } from '../stores/lang';
import { useFormStore } from '../stores/form';
import { iconTaxonomy } from '../stores/taxonomy';
import { replaceMetarTag } from '../utils/weatherFormatter';

const props = defineProps<{
  phraseoData: any
}>();

const emit = defineEmits(['task-selected']);

const langStore = useLangStore();
const formStore = useFormStore();

// --- State ---
const selectedSubgraphs = ref<any[]>([]);
const lastSelectedTaskId = ref<string | null>(null);
const metarData = ref(null);
const metarLoading = ref(false);
const metarError = ref(null);

const selectedTab = ref('SO');
const selectedTaskIds = ref<string[]>([]);
const isReady = ref(false);

const readbackTimer = ref<number | null>(null);
const pendingReadbackTaskId = ref<string | null>(null);
const pendingReadbackText = ref<string | null>(null);
const pendingReadbackLang = ref<string | null>(null);
const readbackReceived = ref(false);

const tasks = ref<any[]>([]);
const taskPhaseMap = ref<Record<string, string[]>>({});

const selectedLanguage = computed(() => langStore.current);

// --- Constants ---
const POL: Record<string, Record<string, string>> = {
  matin: { fr: "bonjour", en: "hello" },
  soir: { fr: "bonsoir", en: "good evening" }
};

const STATION_HIERARCHY = ['NDEL', 'NGND', 'NTWR', 'NAPP', 'NCTR', 'NUNI'] as const;

const FREQUENCY_TO_STATION: Record<string, string> = {
  'DEL': 'NDEL', 
  'GND': 'NGND', 
  'TWR': 'NTWR', 
  'APP': 'NAPP', 
  'CTR': 'NCTR'
};

// --- Helper Functions ---

const getHeure = () => {
  const dt = new Date();
  return dt.getHours() < 19 ? 'matin' : 'soir';
};

const getColorFromClass = (className: string) => {
  const cls = (className || '').toLowerCase();
  if (cls.includes('pilot')) return 'blue';
  if (cls.includes('atc')) return 'yellow';
  if (cls.includes('option')) return 'orange';
  if (cls.includes('info')) return 'orange';
  return 'gray';
};

const getCallsign = () => {
  return formStore.form.CAA || "Station";
};

// --- Logic ---

// Initialisation des tâches à partir des props (remplace created())
const initializeTasks = () => {
  if (!props.phraseoData || !props.phraseoData.processChain) return;
  
  const data = props.phraseoData;
  const calls = data.processChain.tasks.compoundTask.call || [];
  
  const phaseMap: Record<string, string[]> = {};
  calls.forEach((call: any) => {
    const tab = call._tab || '??';
    const id = call._refid;
    if (!phaseMap[tab]) phaseMap[tab] = [];
    phaseMap[tab].push(id);
  });
  taskPhaseMap.value = phaseMap;

  const spawnTasks = (data.processChain.tasks.spawnTask || []).map((task: any) => ({
    _id: task._id,
    _name: task._name,
    _short: task._short,
    _class: task._class,
    _tab: task._tab || '??',
    ...task
  }));

  const orTasks = (data.processChain.tasks.orTask || []).map((task: any) => ({
    _id: task._id,
    _name: task._name,
    _short: task._short,
    _class: task._class,
    _tab: task._tab || '??',
    ...task
  }));

  const allTasks = [...spawnTasks, ...orTasks];
  tasks.value = allTasks.map(task => {
    const call = calls.find((c: any) => c._refid === task._id);
    const taskClass = call ? call._class : task._class || 'info';
    const color = getColorFromClass(taskClass);
    return {
      ...task,
      _class: taskClass,
      _color: color || 'orange'
    };
  });

  // Auto-sélection du premier onglet dispo si nécessaire
  const tabs = Object.keys(taskPhaseMap.value);
  if (tabs.length > 0 && (!selectedTab.value || !tabs.includes(selectedTab.value))) {
    selectedTab.value = tabs[0];
  }
  isReady.value = true;
};

// Computed properties
const phaseTabs = computed(() => {
  return Object.keys(taskPhaseMap.value).map(id => ({
    id,
    icon: iconTaxonomy[id]?.icon || `<strong>${id}</strong>`,
    color: iconTaxonomy[id]?.color || 'gray',
    label: iconTaxonomy[id]?.label || id
  }));
});

const filteredPhaseTasks = computed(() => {
  const currentRefs = taskPhaseMap.value[selectedTab.value] || [];
  return currentRefs
    .map(ref => tasks.value.find(task => task._id === ref))
    .filter(task => task);
});

// --- Methods ---

function findFallbackStation(requestedStation: string, lang: 'fr' | 'en') {
  const startIndex = STATION_HIERARCHY.indexOf(requestedStation as any);
  if (startIndex === -1) return { station: requestedStation, label: requestedStation };

  for (let i = startIndex; i < STATION_HIERARCHY.length; i++) {
    const station = STATION_HIERARCHY[i];
    const freqType = Object.keys(FREQUENCY_TO_STATION).find(k => FREQUENCY_TO_STATION[k] === station);
    
    if (freqType) {
      // On utilise l'indexation sécurisée
      const fKey = freqType as keyof typeof formStore.form;
      const sKey = station as keyof typeof formStore.frequencyLabels;
      
      const val = formStore.form[fKey];
      if (typeof val === 'string' && val.trim() !== '') {
        const label = formStore.frequencyLabels[sKey]?.[lang] || station;
        return { 
          station, 
          label, 
          frequency: val, 
          frequencyType: freqType 
        };
      }
    }
  }
  return { station: requestedStation, label: requestedStation };
}

const safeReplaceMetarTag = (tag: string, metar: any, options: any) => {
  try {
    if (typeof replaceMetarTag === 'function') {
      return replaceMetarTag(tag, metar, options);
    }
  } catch (_) {}
  
  if (!metar) return options?.lang === 'fr' ? 'données météo non disponibles' : 'weather data not available';
  const lang = options?.lang || 'fr';
  const parts = [];
  if (metar.wind) parts.push(lang === 'fr' ? `vent ${metar.wind}` : `wind ${metar.wind}`);
  if (metar.visibility) parts.push(lang === 'fr' ? `visibilité ${metar.visibility}` : `visibility ${metar.visibility}`);
  if (metar.temp != null) parts.push((lang === 'fr' ? 'température ' : 'temperature ') + metar.temp);
  if (metar.qnh != null) parts.push('Q N H ' + metar.qnh);
  return parts.join(', ');
};

/**
 * Prepares text for speech synthesis by replacing placeholders and stripping annotations.
 * @param text The raw text with placeholders.
 * @param lang The language to use for formatting.
 * @returns The processed text ready for speech.
 */
const prepareTextForSpeech = (text: string, lang: string): string => {
  let processed = text.replace(/\[(.*?)\]/g, (match, p1) => {
    switch (p1) {
      case 'POL': {
        const key = getHeure();
        return POL[key][lang as 'fr'|'en'];
      }
      case 'MET': {
        if (metarLoading.value) return lang === 'fr' ? 'chargement des données météo...' : 'loading weather data...';
        if (metarError.value) return lang === 'fr' ? `erreur météo: ${metarError.value}` : `weather error: ${metarError.value}`;
        if (metarData.value) return safeReplaceMetarTag('[MET]', metarData.value, { lang, forSpeech: true });
        return lang === 'fr' ? 'données météo non disponibles' : 'weather data not available';
      }
      case 'HOU': {
        const now = new Date();
        return `${now.getUTCHours().toString().padStart(2, '0')} heures ${now.getMinutes().toString().padStart(2, '0')}`;
      }
      case 'RWY':
        return formStore.formatRunway(formStore.form.RWY, lang as 'fr'|'en');
      case 'DEL':
      case 'GND':
      case 'TWR':
      case 'APP':
      case 'CTR': {
        const freq = formStore.form[p1];
        if (!freq || freq.trim() === '') {
          const requestedStation = FREQUENCY_TO_STATION[p1];
          const fb = findFallbackStation(requestedStation, lang as 'fr'|'en');
          return fb.frequency ? `${fb.label}, ${formStore.formatFrequency(fb.frequency, lang as 'fr'|'en')}` : fb.label;
        }
        const stationKey = p1 as keyof typeof formStore.frequencyLabels;
        const label = formStore.frequencyLabels[stationKey]?.[lang as 'fr'|'en'] || p1;
        return `${label}, ${formStore.formatFrequency(freq, lang as 'fr'|'en')}`;
      }
      case 'NDEL':
      case 'NGND':
      case 'NTWR':
      case 'NAPP':
      case 'NCTR': {
        const directStationKey = p1 as keyof typeof formStore.frequencyLabels;
        const lab = formStore.frequencyLabels[directStationKey]?.[lang as 'fr' | 'en'] || p1;
        return lab;
      }
      default:
        return formStore.form[p1] || match;
    }
  });

  // For speech, we strip the tooltip markers and just keep the content.
  processed = processed.replace(/\{([^}]+)\}/g, '$1');

  return processed;
};

const handleTaskData = (taskId: string) => {
  const taskData = tasks.value.find(t => t._id === taskId);

  if (!taskData) return;

  if (!selectedTaskIds.value.includes(taskId)) {
    selectedTaskIds.value.push(taskId);
  }

  lastSelectedTaskId.value = taskId;

  if ((!taskData.para || !taskData.para.length) && taskData.subgraph?.length) {
    resetDisplay();
    selectedSubgraphs.value = taskData.subgraph.map((sub: any) => {
      const t = tasks.value.find(tt => tt._id === sub.call._refid);
      return {
        refid: sub.call._refid,
        _name: t?._name,
        _short: t?._short || t?._name.slice(0, 3),
        _color: t?._color
      };
    });
    return;
  }

  if (taskData.para?.length) {
    const texts = taskData.para
      .filter((p: any) => p._lang === selectedLanguage.value)
      .map((p: any) => {
        const color = getColorFromClass(p._class);
        const iconData = iconTaxonomy[color] || {};
        return {
          value: p.__text,
          _color: color,
          icon: iconData.icon || ''
        };
      });

    emit('task-selected', texts);
  }

  if (taskData.subgraph?.length) {
    selectedSubgraphs.value = taskData.subgraph.map((sub: any) => {
      const t = tasks.value.find(t => t._id === sub.call._refid)
      return {
        refid: sub.call._refid,
        _name: t?._name,
        _short: t?._short || t?._name.slice(0, 3),
        _color: t?._color
      }
    });
  } else {
    selectedSubgraphs.value = [];
  }
};

const cancelReadbackTimer = () => {
  if (readbackTimer.value) {
    clearTimeout(readbackTimer.value);
    readbackTimer.value = null;
  }
};

const startReadbackTimer = (taskId: string, atcText: string, lang: string) => {
  cancelReadbackTimer();
  readbackReceived.value = false;
  pendingReadbackTaskId.value = taskId;
  pendingReadbackText.value = atcText;
  pendingReadbackLang.value = lang;
  
  readbackTimer.value = window.setTimeout(() => {
    if (!readbackReceived.value) {
      const callsign = getCallsign();
      const requestReadbackText = lang === 'fr' 
        ? `${callsign}, collationnez.` 
        : `${callsign}, read back.`;
      
      console.log("Pas de collationnement reçu, demande de collationnement:", requestReadbackText);
    }
  }, 60000);
};

const checkIfNeedsReadback = (taskId: string) => {
  const taskData = tasks.value.find(t => t._id === taskId);
  
  if (!taskData || !taskData.para || !taskData.para.length) return false;
  
  const lang = selectedLanguage.value;
  const paraElements = taskData.para.filter((p: any) => p._lang === lang);
  
  for (let i = 0; i < paraElements.length - 1; i++) {
    if (paraElements[i]._class === 'ATC' && paraElements[i+1]._class === 'Pilot') {
      return true;
    }
  }
  
  return false;
};

const checkAndSpeakAtcInitiative = (taskId: string) => {
  const taskData = tasks.value.find(t => t._id === taskId);
  
  if (!taskData || !taskData.para || !taskData.para.length) return;
  
  const pilotInitiativeTasks = [
    "PARAMETRES", "DEMANDE_MISE_EN_ROUTE", "DEMANDE_REPOUSSAGE",
    "DEMANDE_ROULAGE", "DEMANDE_ALIGNEMENT", "DEMANDE_DECOLLAGE",
    "DEMANDE_NIVEAU", "DEMANDE_APPROCHE", "DEMANDE_ATTERRISSAGE"
  ];
  
  if (pilotInitiativeTasks.includes(taskId)) {
    console.log(`Tâche ${taskId} est une demande du pilote, pas de synthèse vocale automatique immédiate`);
    
    if (window.lastTranscriptTaskId === taskId) {
      console.log(`Tâche ${taskId} déclenchée par reconnaissance vocale, programmation de la réponse ATC`);
      setTimeout(() => {
        const lang = selectedLanguage.value;
        const atcElements = taskData.para.filter((p: any) => p._lang === lang && p._class === 'ATC');
        
        if (atcElements.length > 0) {
          // const atcText = replacePlaceholders(atcElements[0].__text, lang);
          // this.speakText(atcText, lang);
        }
      }, 1500);
      
      window.lastTranscriptTaskId = null;
    }
    return;
  }
  
  const lang = selectedLanguage.value;
  const atcElements = taskData.para.filter((p: any) => p._lang === lang && p._class === 'ATC');
  
  if (atcElements.length > 0) {
    const firstAtcElement = atcElements[0];
    const atcText = prepareTextForSpeech(firstAtcElement.__text, lang);
    
    const needsReadback = checkIfNeedsReadback(taskId);
    
    if (needsReadback) {
      startReadbackTimer(taskId, atcText, lang);
    }
  }
};

const findTaskById = (id: string) => {
  // On cherche dans le tableau réactif 'tasks' déjà peuplé par initializeTasks
  return tasks.value.find((t: any) => t._id === id) || null;
};

// Quand on clique sur une tâche principale
const logTask = (task: any) => {
  // 1. Gestion visuelle (Boutons qui deviennent verts)
  const currentRefs = taskPhaseMap.value[selectedTab.value] || [];
  const index = currentRefs.indexOf(task._id);
  if (index !== -1) {
    selectedTaskIds.value = currentRefs.slice(0, index + 1);
  }

  // 2. Mise à jour de l'état global
  window.currentTaskId = task._id;
  lastSelectedTaskId.value = task._id;

  // 3. Gestion des options (Subgraphs)
  if (task.subgraph) {
    selectedSubgraphs.value = task.subgraph.map((sub: any) => {
      const t = findTaskById(sub.call._refid);
      return {
        refid: sub.call._refid,
        // On assure l'affichage du nom ici
        _name: t?._name || sub.call._refid, 
        _short: t?._short || t?._name?.slice(0, 3) || sub.call._refid,
        _color: t?._color || 'orange',
        fullTask: t
      };
    });
  } else {
    selectedSubgraphs.value = [];
  }

  emit('task-selected', task.para || []);

  // 4. Logique audio
  //checkAndSpeakAtcInitiative(task._id);
};

const logSubgraphTask = (subgraph: any) => {
  if (!selectedTaskIds.value.includes(subgraph.refid)) {
    selectedTaskIds.value.push(subgraph.refid);
  }
  
  // Utilise l'objet complet récupéré lors du map dans logTask
  if (subgraph.fullTask) {
    const lang = selectedLanguage.value;
    const taskTexts = subgraph.fullTask.para
      ?.filter((p: any) => p._lang === lang)
      .map((p: any) => ({
        __text: p.__text,
        _class: p._class,
        _color: getColorFromClass(p._class)
      })) || [];
      
    emit('task-selected', subgraph.fullTask.para || []);
      //emit('task-selected', taskTexts);
    //checkAndSpeakAtcInitiative(subgraph.refid);
  }
};

const resetDisplay = () => {
  selectedTaskIds.value = [];
  selectedSubgraphs.value = [];
  emit('task-selected', []);
  window.currentTaskId = null;
};

const refreshDisplayedTexts = () => {
  if (lastSelectedTaskId.value) {
    handleTaskData(lastSelectedTaskId.value);
  }
};

const isTranscriptAReadback = (transcript: string) => {
  if (!transcript || !pendingReadbackText.value || !pendingReadbackLang.value) return false;
  
  const normalizedTranscript = transcript.toLowerCase();
  const normalizedAtcText = pendingReadbackText.value.toLowerCase();
  
  const keywordsToCheck = [];
  
  if (normalizedAtcText.includes("niveau") || normalizedAtcText.includes("level")) {
    keywordsToCheck.push("niveau", "level", "descend", "climb", "monte");
  }
  
  if (normalizedAtcText.includes("piste") || normalizedAtcText.includes("runway")) {
    keywordsToCheck.push("piste", "runway");
  }
  
  if (normalizedAtcText.includes("roulez") || normalizedAtcText.includes("taxi")) {
    keywordsToCheck.push("roule", "taxi");
  }
  
  if (normalizedAtcText.includes("bubli") || normalizedAtcText.includes("star")) {
    keywordsToCheck.push("bubli", "star", "via");
  }
  
  const callsign = getCallsign().toLowerCase();
  keywordsToCheck.push(callsign);
  
  let matchCount = 0;
  for (const keyword of keywordsToCheck) {
    if (normalizedTranscript.includes(keyword)) {
      matchCount++;
    }
  }
  
  return matchCount >= 2;
};

const handleTranscriptReceived = (event: any) => {
  const isReadback = event.detail.isReadback;
  
  if (pendingReadbackTaskId.value && pendingReadbackText.value && pendingReadbackLang.value) {
    const transcript = event.detail.transcript;
    
    if (isReadback) {
      console.log("Collationnement détecté, annulation du minuteur");
      readbackReceived.value = true;
      cancelReadbackTimer();
      pendingReadbackTaskId.value = null;
      pendingReadbackText.value = null;
      pendingReadbackLang.value = null;
    } else {
      const isReadbackLocal = isTranscriptAReadback(transcript);
      
      if (isReadbackLocal) {
        console.log("Collationnement détecté par Tabs.vue, annulation du minuteur");
        readbackReceived.value = true;
        cancelReadbackTimer();
        pendingReadbackTaskId.value = null;
        pendingReadbackText.value = null;
        pendingReadbackLang.value = null;
      }
    }
  }
};

// --- Lifecycle ---

onMounted(() => {
  langStore.loadLanguage();
  initializeTasks();
  window.addEventListener('transcript-received', handleTranscriptReceived);
});

onBeforeUnmount(() => {
  window.removeEventListener('transcript-received', handleTranscriptReceived);
  cancelReadbackTimer();
});

// --- Watchers ---

watch(selectedTab, () => {
  resetDisplay();
});

// Watch props change to re-init tasks if data changes (e.g. mode switch)
watch(() => props.phraseoData, () => {
  initializeTasks();
  resetDisplay();
});
</script>
  
<style scoped>
/* Ajoutez des styles spécifiques si nécessaire */
</style>