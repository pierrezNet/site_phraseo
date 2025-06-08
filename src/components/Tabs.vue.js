import { useLangStore } from '../stores/lang';
import { useFormStore } from '../stores/form';
import data from '../assets/phraseologieIFR.json';
import { onMounted, ref, computed, watch } from 'vue';
import { iconTaxonomy } from '../stores/taxonomy';
export default (await import('vue')).defineComponent({
    name: 'Tabs',
    setup() {
        const langStore = useLangStore();
        const formStore = useFormStore();
        const selectedSubgraphs = ref([]);
        const lastSelectedTaskId = ref(null);
        // Utiliser computed pour que selectedLanguage soit réactif aux changements du store
        const selectedLanguage = computed(() => langStore.current);
        onMounted(() => {
            langStore.loadLanguage(); // Chargez la langue lorsque le composant est monté
        });
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
            if (startIndex === -1)
                return { station: requestedStation, label: requestedStation };
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
        const replacePlaceholders = (text) => {
            const lang = selectedLanguage.value;
            // D'abord traiter les placeholders entre crochets
            let processedText = text.replace(/\[(.*?)\]/g, (match, p1) => {
                // Gestion des placeholders spéciaux
                switch (p1) {
                    case 'POL':
                        return POL[getHeure()][lang];
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
                        const fallback = findFallbackStation(p1, lang);
                        return fallback.frequency
                            ? `${fallback.label}, ${formStore.formatFrequency(fallback.frequency, lang)}`
                            : fallback.label;
                    }
                    default:
                        return formStore.form[p1] || match;
                }
            });
            // Ensuite traiter les notes entre accolades pour les transformer en infobulles
            processedText = processTooltips(processedText);
            return processedText;
        };
        const getHeure = () => {
            const dt = new Date();
            return dt.getHours() < 19 ? 'matin' : 'soir';
        };
        return {
            selectedLanguage,
            selectedSubgraphs,
            replacePlaceholders,
            lastSelectedTaskId
        };
    },
    data() {
        return {
            tasks: [],
            taskPhaseMap: {},
            selectedTab: 'SO',
            isReady: false,
            selectedTaskIds: []
        };
    },
    created() {
        const calls = data.processChain.tasks.compoundTask.call || [];
        this.taskPhaseMap = {};
        calls.forEach(call => {
            const tab = call._tab || '??';
            const id = call._refid;
            if (!this.taskPhaseMap[tab])
                this.taskPhaseMap[tab] = [];
            this.taskPhaseMap[tab].push(id);
        });
        const spawnTasks = data.processChain.tasks.spawnTask.map(task => ({
            _id: task._id,
            _name: task._name,
            _class: task._class,
            _tab: task._tab || '??',
            ...task
        }));
        const orTasks = data.processChain.tasks.orTask.map(task => ({
            _id: task._id,
            _name: task._name,
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
                _color: color || 'blue'
            };
        });
        // Auto-sélection du premier onglet dispo
        const tabs = Object.keys(this.taskPhaseMap);
        this.selectedTab = tabs[0] || '';
        this.isReady = true;
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
            if (cls.includes('pilot'))
                return 'blue';
            if (cls.includes('atc'))
                return 'yellow';
            if (cls.includes('option'))
                return 'orange';
            if (cls.includes('info'))
                return 'blue';
            return 'gray'; // fallback
        },
        getTaskNameById(refid) {
            const task = this.tasks.find(task => task._id === refid);
            return task ? task._name : refid; // Retourne le nom de la tâche ou le refid si non trouvé
        },
        handleTaskData(taskId) {
            const taskData = this.tasks.find(t => t._id === taskId)
                || data.processChain.tasks.orTask.find(t => t._id === taskId)
                || data.processChain.tasks.spawnTask.find(t => t._id === taskId);
            if (!taskData)
                return;
            if (!this.selectedTaskIds.includes(taskId)) {
                this.selectedTaskIds.push(taskId);
            }
            // Stocker la dernière tâche sélectionnée pour la réactualisation
            this.lastSelectedTaskId = taskId;
            // Gère les dialogues...
            if (taskData.para?.length) {
                const texts = taskData.para
                    .filter(p => p._lang === this.selectedLanguage)
                    .map(p => {
                    const color = this.getColorFromClass(p._class);
                    const iconData = iconTaxonomy[color] || {};
                    return {
                        value: this.replacePlaceholders(p.__text),
                        _color: color,
                        icon: iconData.icon || ''
                    };
                });
                this.$emit('task-selected', texts);
            }
            // Gère les sous-options
            if (taskData.subgraph?.length) {
                this.selectedSubgraphs = taskData.subgraph.map(sub => ({
                    refid: sub.call._refid,
                    name: this.getTaskNameById(sub.call._refid)
                }));
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
            this.handleTaskData(task._id); // toujours afficher dialogues + subgraphs
        },
        logSubgraphTask(subgraph) {
            const refid = subgraph.refid;
            if (!this.selectedTaskIds.includes(refid)) {
                this.selectedTaskIds.push(refid);
            }
            // Mettre à jour lastSelectedTaskId pour permettre la réactualisation lors du changement de langue
            this.lastSelectedTaskId = refid;
            const taskData = this.tasks.find(t => t._id === refid);
            if (!taskData?.para)
                return;
            const texts = taskData.para
                .filter(p => p._lang === this.selectedLanguage)
                .map(p => ({
                value: this.replacePlaceholders(p.__text),
                _color: this.getColorFromClass(p._class),
                icon: iconTaxonomy[this.getColorFromClass(p._class)]?.icon || ''
            }));
            this.$emit('task-selected', texts);
        },
        resetDisplay() {
            this.selectedSubgraphs = [];
            this.$emit('task-selected', []);
        },
        // Méthode pour rafraîchir les textes affichés quand la langue change
        refreshDisplayedTexts() {
            if (this.lastSelectedTaskId) {
                this.handleTaskData(this.lastSelectedTaskId);
            }
        }
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
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.isReady) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex gap-2 mb-5" },
    });
    for (const [tab, i] of __VLS_getVForSourceType((__VLS_ctx.phaseTabs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.isReady))
                        return;
                    __VLS_ctx.selectedTab = tab.id;
                } },
            key: (i),
            ...{ class: ([
                    'flex items-center p-4 rounded-lg',
                    __VLS_ctx.selectedTab === tab.id
                        ? 'bg-white border border-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 border-0'
                ]) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "inline-block w-5 h-5" },
            title: (tab.label),
        });
        __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (tab.icon) }, null, null);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "" },
    });
    for (const [task] of __VLS_getVForSourceType((__VLS_ctx.filteredPhaseTasks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.isReady))
                        return;
                    __VLS_ctx.logTask(task);
                } },
            key: (task._id),
            ...{ class: ([
                    'w-full text-white rounded-md py-2 mb-4 shadow transition',
                    `bg-${task._color}-700`,
                    `hover:bg-${task._color}-800`,
                    __VLS_ctx.selectedTaskIds.includes(task._id)
                        ? `hover:bg-green-800 text-black bg-green-700`
                        : `hover:bg-${task._color}-800`
                ]) },
        });
        (task._name);
        if (__VLS_ctx.selectedTaskIds.includes(task._id)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "float-right" },
            });
        }
    }
    if (__VLS_ctx.selectedSubgraphs.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: "custom-h2" },
        });
        for (const [subgraph] of __VLS_getVForSourceType((__VLS_ctx.selectedSubgraphs))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.isReady))
                            return;
                        if (!(__VLS_ctx.selectedSubgraphs.length > 0))
                            return;
                        __VLS_ctx.logSubgraphTask(subgraph);
                    } },
                key: (subgraph.refid),
                ...{ class: ([
                        'w-full text-white rounded-md py-2 mb-4 shadow transition',
                        __VLS_ctx.selectedTaskIds.includes(subgraph.refid)
                            ? `hover:bg-orange-800 text-black bg-orange-700`
                            : `bg-orange-700 hover:bg-orange-800`
                    ]) },
            });
            (subgraph.name);
            if (__VLS_ctx.selectedTaskIds.includes(subgraph.refid)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "float-right" },
                });
            }
        }
    }
}
/** @type {__VLS_StyleScopedClasses['']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['transition']} */ ;
/** @type {__VLS_StyleScopedClasses['float-right']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-h2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['transition']} */ ;
/** @type {__VLS_StyleScopedClasses['float-right']} */ ;
var __VLS_dollars;
let __VLS_self;
