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
        <span 
          v-if="selectedTaskIds.includes(task._id)" 
          class="hidden md:inline float-right text-white mr-2"
        >
          ✓
        </span>
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
        <span 
          v-if="selectedTaskIds.includes(subgraph.refid)" 
          class="hidden md:inline float-right text-white mr-2"
        >
          ✓
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useLangStore } from '../stores/lang';
import { useFormStore } from '../stores/form';
import { iconTaxonomy } from '../stores/taxonomy';
import { useWeatherStore } from '../stores/weather';
import { useSimulatorStore } from '../stores/simulator';

const props = defineProps<{
  phraseoData: any
}>();

const emit = defineEmits(['task-selected']);

const langStore = useLangStore();
const formStore = useFormStore();
const weatherStore = useWeatherStore();
const simulatorStore = useSimulatorStore();

// --- State ---
const selectedSubgraphs = ref<any[]>([]);
const selectedTab = ref('SO');
const selectedTaskIds = ref<string[]>([]);
const isReady = ref(false);


const tasks = ref<any[]>([]);
const taskPhaseMap = ref<Record<string, string[]>>({});

// --- Helper Functions ---

const getColorFromClass = (className: string) => {
  const cls = (className || '').toLowerCase();
  if (cls.includes('pilot')) return 'blue';
  if (cls.includes('atc')) return 'yellow';
  if (cls.includes('option')) return 'orange';
  if (cls.includes('info')) return 'orange';
  return 'gray';
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
  simulatorStore.currentTaskId = task._id;

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
};

const logSubgraphTask = (subgraph: any) => {
  if (!selectedTaskIds.value.includes(subgraph.refid)) {
    selectedTaskIds.value.push(subgraph.refid);
  }
  if (subgraph.fullTask) {
    emit('task-selected', subgraph.fullTask.para || []);
  }
};

const resetDisplay = () => {
  selectedTaskIds.value = [];
  selectedSubgraphs.value = [];
  emit('task-selected', []);
  simulatorStore.currentTaskId = null;
};

// --- Lifecycle ---

onMounted(() => {
  langStore.loadLanguage();
  initializeTasks();
});

// --- Watchers ---

watch(selectedTab, () => {
  resetDisplay();
});

// On surveille le changement de terrain pour mettre à jour la météo automatiquement
watch(() => formStore.form.MET, (newIcao) => {
  if (newIcao && newIcao.length === 4) {
    weatherStore.updateMetar(newIcao);
  }
}, { immediate: true });

// Watch props change to re-init tasks if data changes (e.g. mode switch)
watch(() => props.phraseoData, () => {
  initializeTasks();
  resetDisplay();
});
</script>
  
<style scoped>
/* Ajoutez des styles spécifiques si nécessaire */
</style>