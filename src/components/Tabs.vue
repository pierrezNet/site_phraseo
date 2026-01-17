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
            ? `hover:bg-green-700 text-white bg-green-600`
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

<script>
import { defineComponent, onMounted, ref, computed, watch } from 'vue';
import { useLangStore } from '../stores/lang';
import { useFormStore } from '../stores/form';
import data from '../assets/phraseologieIFR.json';
import { iconTaxonomy } from '../stores/taxonomy';
import axios from 'axios'; // TODO Revoir

// TODO revoir fonction : utile, météo par défaut
function safeReplaceMetarTag(tag, metar, options) {
  try {
    if (typeof replaceMetarTag === 'function') {
      return replaceMetarTag(tag, metar, options);
    }
  } catch (_) {}
  // Fallback simple et robuste
  if (!metar) return options?.lang === 'fr' ? 'données météo non disponibles' : 'weather data not available';
  const lang = options?.lang || 'fr';
  const parts = [];
  if (metar.wind) parts.push(lang === 'fr' ? `vent ${metar.wind}` : `wind ${metar.wind}`);
  if (metar.visibility) parts.push(lang === 'fr' ? `visibilité ${metar.visibility}` : `visibility ${metar.visibility}`);
  if (metar.temp != null) parts.push((lang === 'fr' ? 'température ' : 'temperature ') + metar.temp);
  if (metar.qnh != null) parts.push('Q N H ' + metar.qnh);
  return parts.join(', ');
}


export default defineComponent({
  name: 'Tabs',
  setup() {
    const langStore = useLangStore();
    const formStore = useFormStore();
    const selectedSubgraphs = ref([]);
    const lastSelectedTaskId = ref(null);
    const metarData = ref(null);
    const metarLoading = ref(false);
    const metarError = ref(null);

    // Utiliser computed pour que selectedLanguage soit réactif aux changements du store
    const selectedLanguage = computed(() => langStore.current);

    onMounted(() => {
      langStore.loadLanguage(); // Chargez la langue lorsque le composant est monté
      //loadMetarData(); // Charger les données météo au montage
    });

    // Fonction pour charger les données météo
    /*const loadMetarData = async () => {
      try {
        metarLoading.value = true;
        metarError.value = null;
        // Utiliser le code ICAO des paramètres ou LFPG par défaut
        const icao = formStore.form.MET || 'LFPO';
        console.log('Chargement des données météo pour:', icao);
        
        const data = await mockIvaoApi.getMetar(icao);
        metarData.value = data;
        console.log('Données météo chargées:', data);
      } catch (error) {
        console.error('Erreur lors du chargement des données météo:', error);
        metarError.value = error.message || 'Erreur inconnue';
      } finally {
        metarLoading.value = false;
      }
    };*/

    const POL = {
      matin: { fr: "bonjour", en: "hello" },
      soir: { fr: "bonsoir", en: "good evening" }
    };

    // Ordre hiérarchique des stations selon frequencyLabels
    const STATION_HIERARCHY = ['NDEL', 'NGND', 'NTWR', 'NAPP', 'NCTR', 'NUNI'];
    const FREQUENCY_TO_STATION = {
      'DEL': 'NDEL',
      'GND': 'NGND', 
      'TWR': 'NTWR',
      'APP': 'NAPP',
      'CTR': 'NCTR'
    };

    // Fonction pour trouver la station de fallback avec une fréquence valide
    const findFallbackStation = (requestedStation, lang) => {
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
    };

    // Fonction pour transformer les notes entre accolades en infobulles
    const processTooltips = (text) => {
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
    };

    // IMPORTANT: remplace sans HTML si forSpeech=true
    const replacePlaceholders = (text, lang, opts = {}) => {
      const forSpeech = !!opts.forSpeech;
      // [xxx]
      let processed = text.replace(/\[(.*?)\]/g, (match, p1) => {
        switch (p1) {
          case 'POL': {
            const key = getHeure();
            return POL[key][lang];
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
            return formStore.formatRunway(formStore.form.RWY, lang);
          case 'DEL':
          case 'GND':
          case 'TWR':
          case 'APP':
          case 'CTR': {
            const freq = formStore.form[p1];
            if (!freq || freq.trim() === '') {
              const requestedStation = FREQUENCY_TO_STATION[p1];
              const fb = findFallbackStation(requestedStation, lang);
              return fb.frequency ? `${fb.label}, ${formStore.formatFrequency(fb.frequency, lang)}` : fb.label;
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
            const lab = formStore.frequencyLabels[p1]?.[lang] || p1;
            return lab;
          }
          default:
            return formStore.form[p1] || match;
        }
      });

      // {note} -> infobulle SEULEMENT pour l'affichage (pas pour TTS)
      if (!forSpeech) {
        processed = processed.replace(/\{([^}]+)\}/g, (match, content) => {
          const id = `tooltip-${Math.random().toString(36).slice(2, 11)}`;
          return `<span class="relative inline-block">
            <button type="button" class="text-blue-400 underline decoration-dotted cursor-help focus:outline-none"
              onclick="this.nextElementSibling.classList.toggle('hidden')"
              onblur="setTimeout(() => this.nextElementSibling.classList.add('hidden'), 150)">ℹ️</button>
            <div class="hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 w-max max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg break-words">
              <div class="whitespace-normal">${content}</div>
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </span>`;
        });
      } else {
        // pour la voix, on supprime simplement les accolades
        processed = processed.replace(/\{([^}]+)\}/g, '$1');
      }

      return processed;
    };

    // Prépare le texte pour la voix (MET, placeholders, épellations)
    async function prepareTextForSpeech(text, lang) {
      let processedText = text;

      if (processedText.includes('[MET]')) {
        if (metarLoading.value) {
          processedText = processedText.replace(/\[MET\]/g, lang === 'fr' ? 'chargement des données météo...' : 'loading weather data...');
        } else if (metarError.value) {
          processedText = processedText.replace(/\[MET\]/g, lang === 'fr' ? `erreur météo: ${metarError.value}` : `weather error: ${metarError.value}`);
        } else if (metarData.value) {
          const metarText = safeReplaceMetarTag('[MET]', metarData.value, { lang, forSpeech: true });
          processedText = processedText.replace(/\[MET\]/g, metarText);
        } else {
          processedText = processedText.replace(/\[MET\]/g, lang === 'fr' ? 'données météo non disponibles' : 'weather data not available');
        }
      }

      processedText = replacePlaceholders(processedText, lang, { forSpeech: true });

      // Corrections d’acronymes courants
      processedText = processedText
        .replace(/Charlie Tango Oscar Tango/g, 'C. T. O. T.')
        .replace(/Quebec November Hotel/g, 'Q. N. H.');

      return processedText;
    }

    const getHeure = () => {
      const dt = new Date();
      return dt.getHours() < 19 ? 'matin' : 'soir';
    };

    return {
      selectedLanguage,
      selectedSubgraphs,
      replacePlaceholders,
      lastSelectedTaskId,
      metarData,
      metarLoading,
      metarError,
      //loadMetarData,
      replacePlaceholders, // pour l'affichage
      prepareTextForSpeech // pour la voix
    };
  },
  data() {
    return {
      tasks: [],
      taskPhaseMap: {},
      selectedTab: 'SO',
      isReady: false,
      selectedTaskIds: [],
      readbackTimer: null, // Minuteur pour vérifier si le collationnement est reçu
      pendingReadbackTaskId: null, // ID de la tâche en attente de collationnement
      pendingReadbackText: null, // Texte ATC en attente de collationnement
      pendingReadbackLang: null, // Langue du texte ATC en attente de collationnement
      readbackReceived: false // Indique si un collationnement a été reçu
    };
  },
  created() {
    const calls = data.processChain.tasks.compoundTask.call || [];
    this.taskPhaseMap = {};
    calls.forEach(call => {
      const tab = call._tab || '??';
      const id = call._refid;

      if (!this.taskPhaseMap[tab]) this.taskPhaseMap[tab] = [];
      this.taskPhaseMap[tab].push(id);
    });

    const spawnTasks = data.processChain.tasks.spawnTask.map(task => ({
      _id: task._id,
      _name: task._name,
      _short: task._short,
      _class: task._class,
      _tab: task._tab || '??',
      ...task
    }));

    const orTasks = data.processChain.tasks.orTask.map(task => ({
      _id: task._id,
      _name: task._name,
      _short: task._short,
      _class: task._class,
      _tab: task._tab || '??',
      ...task
    }));

    // Fusionner les tâches avec les classes de calls
    const allTasks = [...spawnTasks, ...orTasks];
    this.tasks = allTasks.map(task => {
      const call = calls.find(call => call._refid === task._id);
      const taskClass = call ? call._class : task._class || 'info';
      const color = this.getColorFromClass(taskClass);
      // console.log("color :", color);
      return {
        ...task,
        _class: taskClass,
        _color: color || 'orange'
      };
    });

    // Auto-sélection du premier onglet dispo
    const tabs = Object.keys(this.taskPhaseMap);
    this.selectedTab = tabs[0] || '';
    this.isReady = true;
    
    // Écouter les événements de reconnaissance vocale pour détecter le collationnement
    window.addEventListener('transcript-received', this.handleTranscriptReceived);
  },
  beforeDestroy() {
    // Nettoyer les écouteurs d'événements
    window.removeEventListener('transcript-received', this.handleTranscriptReceived);
    this.cancelReadbackTimer();
  },
  beforeUnmount() {
    window.removeEventListener('transcript-received', this.handleTranscriptReceived);
    this.cancelReadbackTimer();
  },
  computed: {
    phaseTabs() {
      return Object.keys(this.taskPhaseMap).map(id => ({
        id,
        icon: iconTaxonomy[id]?.icon || `<strong>${id}</strong>`,
        color: iconTaxonomy[id]?.color || 'gray',
        label: iconTaxonomy[id]?.label || id
      }));
    },
    filteredPhaseTasks() {
      const currentRefs = this.taskPhaseMap[this.selectedTab] || [];
      //console.log("Références phase :", currentRefs);
      return currentRefs
        .map(ref => this.tasks.find(task => task._id === ref))
        .filter(task => task); // éviter les undefined
    }
  },
  methods: {
    getColorFromClass(className) {
      const cls = (className || '').toLowerCase();

      if (cls.includes('pilot')) return 'blue';
      if (cls.includes('atc')) return 'yellow';
      if (cls.includes('option')) return 'orange';
      if (cls.includes('info')) return 'orange';

      return 'gray'; // fallback
    },
    getTaskNameById(refid) {
      const task = this.tasks.find(task => task._id === refid);
      return {
        refid: sub.call._refid,
        _name: task._name,
        _short: task._short || task._name.slice(0, 3) // ou n'importe quel fallback  
      }
    },
    handleTaskData(taskId) {
      const taskData = this.tasks.find(t => t._id === taskId)
        || data.processChain.tasks.orTask.find(t => t._id === taskId)
        || data.processChain.tasks.spawnTask.find(t => t._id === taskId);

      if (!taskData) return;

      if (!this.selectedTaskIds.includes(taskId)) {
        this.selectedTaskIds.push(taskId);
      }

      // Stocker la dernière tâche sélectionnée pour la réactualisation
      this.lastSelectedTaskId = taskId;
    
      // Si pas de para mais des sous-graphes, on reset
      if ((!taskData.para || !taskData.para.length) && taskData.subgraph?.length) {
        this.resetDisplay();
        this.selectedSubgraphs = taskData.subgraph.map(sub => {
          const t = this.tasks.find(tt => tt._id === sub.call._refid);
          return {
            refid: sub.call._refid,
            _name: t._name,
            _short: t._short || t._name.slice(0, 3),
            _color: t._color
          };
        });
        return;
      }

      // Gère les dialogues...
      if (taskData.para?.length) {
        const texts = taskData.para
          .filter(p => p._lang === this.selectedLanguage)
          .map(p => {
            const color = this.getColorFromClass(p._class);
            const iconData = iconTaxonomy[color] || {};
            return {
              value: p.__text, // Passer le texte brut, le remplacement sera fait dans TaskTextDisplay
              _color: color,
              icon: iconData.icon || ''
            };
          });

        this.$emit('task-selected', texts);
      }

      // Gère les sous-options
      if (taskData.subgraph?.length) {
        this.selectedSubgraphs = taskData.subgraph.map(sub => {
          const t = this.tasks.find(t => t._id === sub.call._refid)
          return {
            refid: sub.call._refid,
            _name: t._name,
            _short: t._short || t._name.slice(0, 3),
            _color: t._color
          }
        });
      }
      else {
        this.selectedSubgraphs = [];
      }
    },
    logTask(task) {
      // Réinitialiser les sélections à partir de cette tâche
      const index = this.taskPhaseMap[this.selectedTab].indexOf(task._id);
      const tasksToKeep = this.taskPhaseMap[this.selectedTab].slice(0, index + 1);

      this.selectedTaskIds = tasksToKeep;

      // Mettre à jour l'ID de la tâche actuellement sélectionnée dans la variable globale
      window.currentTaskId = task._id;
      console.log(`Tâche sélectionnée: ${task._id}`);

      this.handleTaskData(task._id); // toujours afficher dialogues + subgraphs
      
      // Vérifier si la tâche est à l'initiative de l'ATC
      this.checkAndSpeakAtcInitiative(task._id);
    },

    logSubgraphTask(subgraph) {
      const refid = subgraph.refid;
      if (!this.selectedTaskIds.includes(refid)) {
        this.selectedTaskIds.push(refid);
      }
      
      // Mettre à jour lastSelectedTaskId pour permettre la réactualisation lors du changement de langue
      this.lastSelectedTaskId = refid;
      
      // Mettre à jour l'ID de la tâche actuellement sélectionnée dans la variable globale
      window.currentTaskId = refid;
      console.log(`Sous-tâche sélectionnée: ${refid}`);
      
      const taskData = this.tasks.find(t => t._id === refid);
      if (!taskData?.para) return;

      const texts = taskData.para
        .filter(p => p._lang === this.selectedLanguage)
        .map(p => ({
          value: p.__text, // Passer le texte brut, le remplacement sera fait dans TaskTextDisplay
          _color: this.getColorFromClass(p._class),
          icon: iconTaxonomy[this.getColorFromClass(p._class)]?.icon || ''
        }));

      this.$emit('task-selected', texts);
      
      // Vérifier si la sous-tâche est à l'initiative de l'ATC
      this.checkAndSpeakAtcInitiative(refid);
    },
    resetDisplay() {
      this.selectedSubgraphs = [];
      this.$emit('task-selected', []);
      
      // Réinitialiser l'ID de la tâche actuellement sélectionnée dans la variable globale
      window.currentTaskId = null;
      console.log("Affichage réinitialisé, aucune tâche sélectionnée");
    },
    // Méthode pour rafraîchir les textes affichés quand la langue change
    refreshDisplayedTexts() {
      if (this.lastSelectedTaskId) {
        this.handleTaskData(this.lastSelectedTaskId);
      }
    },
    
    // Méthode pour vérifier si une tâche est à l'initiative de l'ATC et lancer la synthèse vocale
    checkAndSpeakAtcInitiative(taskId) {
      // Trouver la tâche dans les données
      const taskData = this.tasks.find(t => t._id === taskId)
        || data.processChain.tasks.orTask.find(t => t._id === taskId)
        || data.processChain.tasks.spawnTask.find(t => t._id === taskId);
      
      if (!taskData || !taskData.para || !taskData.para.length) return;
      
      // Liste des tâches qui sont des demandes du pilote et ne doivent pas déclencher de synthèse vocale automatique
      const pilotInitiativeTasks = [
        "PARAMETRES",           // Demande de paramètres
        "DEMANDE_MISE_EN_ROUTE", // Demande de mise en route
        "DEMANDE_REPOUSSAGE",   // Demande de repoussage
        "DEMANDE_ROULAGE",      // Demande de roulage
        "DEMANDE_ALIGNEMENT",   // Demande d'alignement
        "DEMANDE_DECOLLAGE",    // Demande de décollage
        "DEMANDE_NIVEAU",       // Demande de changement de niveau
        "DEMANDE_APPROCHE",     // Demande d'approche
        "DEMANDE_ATTERRISSAGE"  // Demande d'atterrissage
      ];
      
      // Si la tâche est une demande du pilote, ne pas déclencher la synthèse vocale automatiquement
      // lors du clic sur le bouton, mais vérifier si elle a été déclenchée par reconnaissance vocale
      if (pilotInitiativeTasks.includes(taskId)) {
        console.log(`Tâche ${taskId} est une demande du pilote, pas de synthèse vocale automatique immédiate`);
        
        // Vérifier si cette tâche a été déclenchée par reconnaissance vocale
        // Si oui, programmer une réponse ATC après un court délai
        if (window.lastTranscriptTaskId === taskId) {
          console.log(`Tâche ${taskId} déclenchée par reconnaissance vocale, programmation de la réponse ATC`);
          setTimeout(() => {
            // Trouver la réponse ATC correspondante
            const lang = this.selectedLanguage;
            const atcElements = taskData.para.filter(p => p._lang === lang && p._class === 'ATC');
            
            if (atcElements.length > 0) {
              // Remplacer les placeholders dans le texte ATC
              const atcText = this.replacePlaceholders(atcElements[0].__text, lang);
              
              // Lancer la synthèse vocale
              // this.speakText(atcText, lang);
            }
          }, 1500); // Délai de 1.5 secondes avant la réponse ATC
          
          // Réinitialiser l'ID de la dernière tâche reconnue
          window.lastTranscriptTaskId = null;
        }
        return;
      }
      
      // Vérifier si le premier élément de para est de classe ATC
      const lang = this.selectedLanguage;
      const atcElements = taskData.para.filter(p => p._lang === lang && p._class === 'ATC');
      
      if (atcElements.length > 0) {
        // Trouver le premier élément ATC
        const firstAtcElement = atcElements[0];
        
        // Remplacer les placeholders dans le texte ATC
        // Note: replacePlaceholders ne traite pas correctement [MET] pour la synthèse vocale,
        // car il est conçu pour l'affichage visuel. Nous utilisons directement le texte brut.
        const atcText = this.replacePlaceholders(firstAtcElement.__text, lang); //firstAtcElement.__text;
        
        // Lancer la synthèse vocale avec le texte brut (prepareTextForSpeech s'occupera de [MET])
        // this.speakText(atcText, lang);
        
        // Vérifier si cette tâche nécessite un collationnement
        const needsReadback = this.checkIfNeedsReadback(taskId);
        
        if (needsReadback) {
          // Démarrer un minuteur pour vérifier si le collationnement est reçu
          this.startReadbackTimer(taskId, atcText, lang);
        }
      }
    },
    
    // Méthode pour vérifier si une tâche nécessite un collationnement
    checkIfNeedsReadback(taskId) {
      // Trouver la tâche dans les données
      const taskData = this.tasks.find(t => t._id === taskId)
        || data.processChain.tasks.orTask.find(t => t._id === taskId)
        || data.processChain.tasks.spawnTask.find(t => t._id === taskId);
      
      if (!taskData || !taskData.para || !taskData.para.length) return false;
      
      // Nouvelle règle : le collationnement est obligatoire dès lors que dans la branche 
      // il reste un texte qui doit être lu par le pilote après une réponse ATC
      
      const lang = this.selectedLanguage;
      const paraElements = taskData.para.filter(p => p._lang === lang);
      
      // Parcourir les éléments para pour trouver la séquence ATC -> Pilot
      for (let i = 0; i < paraElements.length - 1; i++) {
        if (paraElements[i]._class === 'ATC' && paraElements[i+1]._class === 'Pilot') {
          // Si on trouve une séquence ATC suivi d'un Pilot, alors un collationnement est nécessaire
          return true;
        }
      }
      
      return false;
    },
    
    // Méthode pour démarrer un minuteur pour vérifier si le collationnement est reçu
    startReadbackTimer(taskId, atcText, lang) {
      // Annuler tout minuteur existant
      this.cancelReadbackTimer();
      
      // Réinitialiser l'indicateur de collationnement reçu
      this.readbackReceived = false;
      
      // Stocker les informations sur la tâche en attente de collationnement
      this.pendingReadbackTaskId = taskId;
      this.pendingReadbackText = atcText;
      this.pendingReadbackLang = lang;
      
      // Démarrer un nouveau minuteur
      this.readbackTimer = setTimeout(() => {
        // Si le minuteur expire et qu'aucun collationnement n'a été reçu,
        // demander au pilote de collationner
        if (!this.readbackReceived) {
          const callsign = this.getCallsign();
          const requestReadbackText = lang === 'fr' 
            ? `${callsign}, collationnez.` 
            : `${callsign}, read back.`;
          
          console.log("Pas de collationnement reçu, demande de collationnement:", requestReadbackText);
          // this.speakText(requestReadbackText, lang);
        }
      }, 60000); // 60 secondes = 1 minute
    },
    
    // Méthode pour annuler le minuteur de collationnement
    cancelReadbackTimer() {
      if (this.readbackTimer) {
        clearTimeout(this.readbackTimer);
        this.readbackTimer = null;
      }
    },
    
    // Méthode pour gérer les transcripts reçus
    handleTranscriptReceived(event) {
      // Vérifier si le transcript est marqué comme un collationnement par Navbar.vue
      const isReadback = event.detail.isReadback;
      
      // Vérifier si nous attendons un collationnement
      if (this.pendingReadbackTaskId && this.pendingReadbackText && this.pendingReadbackLang) {
        const transcript = event.detail.transcript;
        
        if (isReadback) {
          console.log("Collationnement détecté, annulation du minuteur");
          this.readbackReceived = true;
          this.cancelReadbackTimer();
          
          // Nettoyer les informations sur la tâche en attente de collationnement
          this.pendingReadbackTaskId = null;
          this.pendingReadbackText = null;
          this.pendingReadbackLang = null;
        } else {
          // Si ce n'est pas un collationnement selon Navbar.vue, vérifier avec notre propre méthode
          const isReadbackLocal = this.isTranscriptAReadback(transcript);
          
          if (isReadbackLocal) {
            console.log("Collationnement détecté par Tabs.vue, annulation du minuteur");
            this.readbackReceived = true;
            this.cancelReadbackTimer();
            
            // Nettoyer les informations sur la tâche en attente de collationnement
            this.pendingReadbackTaskId = null;
            this.pendingReadbackText = null;
            this.pendingReadbackLang = null;
          }
        }
      }
    },
    
    // Méthode pour déterminer si un transcript est un collationnement
    isTranscriptAReadback(transcript) {
      if (!transcript || !this.pendingReadbackText || !this.pendingReadbackLang) return false;
      
      // Normaliser les textes pour la comparaison
      const normalizedTranscript = transcript.toLowerCase();
      const normalizedAtcText = this.pendingReadbackText.toLowerCase();
      
      // Extraire les mots clés de l'instruction ATC
      const keywordsToCheck = [];
      
      // Vérifier les mots clés spécifiques selon le type d'instruction
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
      
      // Ajouter l'indicatif d'appel comme mot clé
      const callsign = this.getCallsign().toLowerCase();
      keywordsToCheck.push(callsign);
      
      // Compter combien de mots clés sont présents dans le transcript
      let matchCount = 0;
      for (const keyword of keywordsToCheck) {
        if (normalizedTranscript.includes(keyword)) {
          matchCount++;
        }
      }
      
      // Si au moins 2 mots clés sont présents, considérer comme un collationnement
      return matchCount >= 2;
    },
    
    // Méthode pour obtenir l'indicatif d'appel
    getCallsign() {
      const formStore = useFormStore();
      return formStore.form.CAA || "Station";
    },
    
    // Méthode pour traiter le texte avant la synthèse vocale
    async prepareTextForSpeech(text, lang) {
      // Pour la synthèse vocale, on veut remplacer le tag [MET] par les données météo
      let processedText = text;
      
      // Traiter le tag [MET] spécifiquement si présent
      if (processedText.includes('[MET]')) {
        try {
          // Utiliser le code ICAO des paramètres ou LFPG par défaut
          const formStore = useFormStore();
          const icao = formStore.form.MET || 'LFPG';
          console.log('Préparation du tag [MET] pour la synthèse vocale avec ICAO:', icao);
          
          // Récupérer les données météo
          //const metar = await mockIvaoApi.getMetar(icao);
          
          // Définir les options de formatage avec forSpeech=true pour appliquer les règles d'épellation
          const options = { lang, forSpeech: true };
          
          // Remplacer le tag [MET] par les données formatées
          const metarText = replaceMetarTag('[MET]', metar, options);
          processedText = processedText.replace(/\[MET\]/g, metarText);
          console.log('Tag [MET] remplacé pour la synthèse vocale:', metarText);
        } catch (err) {
          console.error('Erreur lors du traitement du tag [MET] pour la synthèse vocale:', err);
          // En cas d'erreur, remplacer par un message d'erreur
          const errorMessage = lang === 'fr' 
            ? 'données météo non disponibles' 
            : 'weather data not available';
          processedText = processedText.replace(/\[MET\]/g, errorMessage);
        }
      }
      
      // Traiter tous les autres placeholders standards
      processedText = this.replacePlaceholders(processedText, lang);
      
      // Appliquer les règles d'épellation pour l'aviation à tout le texte
      // processedText = formatTextForAviationSpeech(processedText);
      
      // Vérifier et remplacer manuellement les acronymes spécifiques qui posent problème
      processedText = processedText.replace(/Charlie Tango Oscar Tango/g, "C. T. O. T.");
      processedText = processedText.replace(/Quebec November Hotel/g, "Q. N. H.");
      
      console.log('Texte préparé pour synthèse vocale (avec météo):', processedText);
      return processedText;
    },
    
    // Méthode pour lancer la synthèse vocale
    /*async speakText(text, lang) {

    }*/
  },
  watch: {
    selectedTab() {
      this.resetDisplay();
    },
    // Watcher pour détecter les changements de langue et rafraîchir les textes
    selectedLanguage() {
      this.refreshDisplayedTexts();
    }
  }
});
</script>
  
<style scoped>
/* Ajoutez des styles spécifiques si nécessaire */
</style>
