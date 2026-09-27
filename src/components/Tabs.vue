<template>
  <div class="p-1 md:p-4" v-if="isReady">
    <!-- Onglets des phases de vol -->
    <div class="flex justify-between md:justify-start gap-1 md:gap-4 mb-1 md:mb-5">
      <button
        v-for="(tab, i) in phaseTabs"
        :key="i"
        @click="selectedTab = tab.id"
        :class="[
          'phase-tab flex items-center p-4 rounded-lg transition',
          selectedTab === tab.id && 'phase-tab--active'
        ]"
      >
      <span
        v-html="tab.icon"
        class="inline-block w-5 h-5"
        :title="tab.label"
      ></span>
      </button>
    </div>

    <!-- Carte interactive VFR débutant (desktop) -->
    <CircuitMap
      v-if="showCircuitMap"
      class="hidden md:block mb-4"
      :selectedTaskIds="selectedTaskIds"
      @select-task="onMapSelect"
    />

    <!-- Contenu des tâches par phase — accordéon par sous-thème -->
    <div :class="[showCircuitMap ? 'md:hidden' : '']">
      <template v-for="grp in displayGroups" :key="grp.name">
        <!-- Groupe accordéon dans un panneau ; groupe libre sans cadre -->
        <div :class="grp.header ? 'group-panel mt-2 rounded-md overflow-hidden' : 'mt-2'">
        <!-- En-tête repliable — seulement pour les groupes multi-tâches (hors débutant) -->
        <button
          v-if="grp.header"
          type="button"
          @click="toggleGroup(grp.name)"
          class="group-header w-full flex items-center justify-between px-2 py-1.5 text-sm font-semibold transition"
        >
          <span>{{ grp.name }}</span>
          <span class="text-xs font-normal opacity-70">{{ grp.tasks.length }}&nbsp;{{ openGroup === grp.name ? '▾' : '▸' }}</span>
        </button>

        <div
          v-show="grp.alwaysOpen || openGroup === grp.name"
          :class="['flex flex-wrap md:grid md:grid-cols-1 gap-1', grp.header ? 'px-1 pb-1 pt-1' : '']"
        >
          <button
            v-for="task in grp.tasks"
            :key="task._id"
            :class="[
              'task-btn md:w-full rounded-md px-3 py-1.5 my-1 md:p-2 md:mb-2 md:flex md:items-center md:text-center',
              task._id === simulatorStore.currentTaskId
                ? 'task-btn--active'
                : selectedTaskIds.includes(task._id) && 'task-btn--done'
            ]"
            @click="logTask(task)"
          >
            <svg v-if="task.subgraph && !task.para?.length" class="hidden md:block w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
            <PilotIcon v-else-if="getInitiator(task) === 'Pilot'" class="hidden md:block w-5 h-5 shrink-0" />
            <AtcIcon v-else-if="getInitiator(task) === 'ATC'" class="hidden md:block w-5 h-5 shrink-0" />
            <span v-else class="hidden md:block w-5 h-5 shrink-0"></span>
            <span class="hidden md:inline flex-1">{{ task._name }}</span>
            <span class="inline md:hidden whitespace-nowrap">{{ task._short }}</span>
            <span
              v-if="selectedTaskIds.includes(task._id)"
              class="task-btn__check hidden md:block w-4 shrink-0"
            >
              ✓
            </span>
            <span v-else class="hidden md:block w-4 shrink-0"></span>
          </button>
        </div>
        </div>

        <!-- Options rattachées au groupe de la tâche active (juste sous son accordéon) -->
        <template v-if="selectedSubgraphs.length > 0 && grp.tasks.some((t) => t._id === simulatorStore.currentTaskId)">
          <hr class="md:hidden border border-blue-800 mt-1 mb-1" />
          <div class="flex flex-wrap md:grid md:grid-cols-1 gap-1 mt-1">
            <h2 class="custom-h2 hidden md:flex w-full">Options</h2>
            <button
              v-for="subgraph in selectedSubgraphs"
              :key="subgraph.refid"
              :class="[
                'task-btn md:w-full rounded-md px-3 py-1.5 my-1 md:p-2 md:mb-2 md:flex md:items-center md:text-center',
                subgraph.refid === simulatorStore.currentTaskId
                  ? 'task-btn--active'
                  : selectedTaskIds.includes(subgraph.refid) && 'task-btn--done'
              ]"
              @click="logSubgraphTask(subgraph)"
            >
              <PilotIcon v-if="getInitiator(subgraph.fullTask) === 'Pilot'" class="hidden md:block w-5 h-5 shrink-0" />
              <AtcIcon v-else-if="getInitiator(subgraph.fullTask) === 'ATC'" class="hidden md:block w-5 h-5 shrink-0" />
              <span v-else class="hidden md:block w-5 h-5 shrink-0"></span>
              <span class="hidden md:inline flex-1">{{ subgraph._name }}</span>
              <span class="inline md:hidden whitespace-nowrap">{{ subgraph._short }}</span>
              <span
                v-if="selectedTaskIds.includes(subgraph.refid)"
                class="task-btn__check hidden md:block w-4 shrink-0"
              >
                ✓
              </span>
              <span v-else class="hidden md:block w-4 shrink-0"></span>
            </button>
          </div>
        </template>
      </template>
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
import PilotIcon from './icons/PilotIcon.vue';
import AtcIcon from './icons/AtcIcon.vue';
import CircuitMap from './CircuitMap.vue';
import { groupOf, groupOrder } from '../utils/taskGroups';

const props = defineProps<{
  phraseoData: any
  currentMode?: string
}>();

const emit = defineEmits(['task-selected', 'update:context']);

const langStore = useLangStore();
const formStore = useFormStore();
const weatherStore = useWeatherStore();
const simulatorStore = useSimulatorStore();

// --- State ---
const selectedSubgraphs = ref<any[]>([]);
const selectedTab = ref('SO');
const selectedTaskIds = ref<string[]>([]);
const isReady = ref(false);
const tabChangedFromMap = ref(false);

// Contexte affiché (fil d'Ariane) : étape principale + option choisie
const currentStep = ref('');
const currentOption = ref('');
const emitContext = () =>
  emit('update:context', { step: currentStep.value, option: currentOption.value });


const tasks = ref<any[]>([]);
const taskPhaseMap = ref<Record<string, string[]>>({});

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
    return { ...task, _class: taskClass };
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

const showCircuitMap = computed(() =>
  props.currentMode === 'VFR' && formStore.form.LEVEL === 'débutant' && selectedTab.value !== 'EX'
);

// Niveaux cumulatifs : débutant < intermédiaire < avancé
const LEVEL_HIERARCHY = ['débutant', 'intermédiaire', 'avancé'] as const;

const isTaskVisible = (task: any): boolean => {
  if (!task || !task._level) return true; // pas de niveau = toujours visible
  const userLevelIndex = LEVEL_HIERARCHY.indexOf(formStore.form.LEVEL as any);
  const taskLevelIndex = LEVEL_HIERARCHY.indexOf(task._level);
  // _levelExact : visible uniquement si le niveau correspond exactement
  if (task._levelExact) return taskLevelIndex === userLevelIndex;
  return taskLevelIndex <= userLevelIndex;
};

const hasVisibleContent = (task: any): boolean => {
  // Si la tâche a du texte propre, elle a du contenu
  if (task.para && task.para.length > 0) return true;
  // Sinon, vérifier si au moins un enfant subgraph est visible
  if (task.subgraph) {
    return task.subgraph.some((sub: any) => {
      const child = tasks.value.find((t: any) => t._id === sub.call._refid);
      return child && isTaskVisible(child);
    });
  }
  return false;
};

const filteredPhaseTasks = computed(() => {
  const currentRefs = taskPhaseMap.value[selectedTab.value] || [];
  return currentRefs
    .map(ref => tasks.value.find(task => task._id === ref))
    .filter(task => task && isTaskVisible(task) && hasVisibleContent(task));
});

// --- Regroupement par sous-thème (accordéon) ---
const groupedPhaseTasks = computed(() => {
  const map = new Map<string, any[]>();
  filteredPhaseTasks.value.forEach((t: any) => {
    const g = groupOf(t, selectedTab.value);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(t);
  });
  const groups: { name: string; tasks: any[] }[] = [];
  groupOrder(selectedTab.value).forEach((name) => {
    if (map.has(name)) { groups.push({ name, tasks: map.get(name)! }); map.delete(name); }
  });
  map.forEach((tasks, name) => groups.push({ name, tasks }));
  return groups;
});

const isBeginnerLevel = computed(() => formStore.form.LEVEL === 'débutant');

// Groupes affichés : liste plate en débutant ; sinon TOUT en accordéon
// (même les groupes à une seule tâche), pour une lecture uniforme.
const displayGroups = computed(() => {
  if (isBeginnerLevel.value) {
    return [{ name: '__flat__', tasks: filteredPhaseTasks.value, header: false, alwaysOpen: true }];
  }
  return groupedPhaseTasks.value.map((g) => ({
    name: g.name,
    tasks: g.tasks,
    header: true,
    alwaysOpen: false,
  }));
});

// Accordéon exclusif : un seul groupe ouvert à la fois
const openGroup = ref<string | null>(null);
const toggleGroup = (name: string) => {
  openGroup.value = openGroup.value === name ? null : name;
};
// À l'ouverture d'une phase : ouvrir le 1er groupe, fermer les autres
const resetOpenGroups = () => {
  openGroup.value = groupedPhaseTasks.value[0]?.name ?? null;
};

// --- Methods ---

const getInitiator = (task: any): string => {
  if (!task?.para?.length) return '';
  const firstFr = task.para.find((p: any) => p._lang === 'fr');
  return firstFr?._class || '';
};

const onMapSelect = (taskId: string, tab?: string) => {
  if (tab && tab !== selectedTab.value) {
    tabChangedFromMap.value = true;
    selectedTab.value = tab;
  }
  // Reset puis sélectionner uniquement ce point
  selectedTaskIds.value = [taskId];
  selectedSubgraphs.value = [];
  simulatorStore.currentTaskId = taskId;
  const task = tasks.value.find((t: any) => t._id === taskId);
  if (!task) return;

  currentStep.value = task._name;
  currentOption.value = '';

  // Gestion des subgraphs
  if (task.subgraph) {
    const visibleSubgraphs = task.subgraph
      .map((sub: any) => {
        const t = findTaskById(sub.call._refid);
        return {
          refid: sub.call._refid,
          _name: t?._name || sub.call._refid,
          _short: t?._short || t?._name?.slice(0, 3) || sub.call._refid,
          fullTask: t
        };
      })
      .filter((sub: any) => isTaskVisible(sub.fullTask));

    if (visibleSubgraphs.length === 1) {
      selectedSubgraphs.value = [];
      const single = visibleSubgraphs[0];
      if (single.fullTask) {
        selectedTaskIds.value.push(single.refid);
        currentOption.value = single._name;
        const combined = [...(task.para || []), ...(single.fullTask.para || [])];
        emit('task-selected', combined);
      } else {
        emit('task-selected', task.para || []);
      }
    } else {
      selectedSubgraphs.value = visibleSubgraphs;
      emit('task-selected', task.para || []);
    }
  } else {
    emit('task-selected', task.para || []);
  }
  emitContext();
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
  simulatorStore.currentTaskId = task._id;
  currentStep.value = task._name;
  currentOption.value = '';

  // 3. Gestion des options (Subgraphs) — filtrage par niveau
  if (task.subgraph) {
    const visibleSubgraphs = task.subgraph
      .map((sub: any) => {
        const t = findTaskById(sub.call._refid);
        return {
          refid: sub.call._refid,
          _name: t?._name || sub.call._refid,
          _short: t?._short || t?._name?.slice(0, 3) || sub.call._refid,
          fullTask: t
        };
      })
      .filter((sub: any) => isTaskVisible(sub.fullTask));

    // Si une seule option visible, auto-sélection : concaténer les textes
    if (visibleSubgraphs.length === 1) {
      selectedSubgraphs.value = [];
      const single = visibleSubgraphs[0];
      if (single.fullTask) {
        if (!selectedTaskIds.value.includes(single.refid)) {
          selectedTaskIds.value.push(single.refid);
        }
        currentOption.value = single._name;
        const combined = [...(task.para || []), ...(single.fullTask.para || [])];
        emit('task-selected', combined);
      } else {
        emit('task-selected', task.para || []);
      }
    } else {
      selectedSubgraphs.value = visibleSubgraphs;
      emit('task-selected', task.para || []);
    }
  } else {
    selectedSubgraphs.value = [];
    emit('task-selected', task.para || []);
  }
  emitContext();
};

const logSubgraphTask = (subgraph: any) => {
  if (!selectedTaskIds.value.includes(subgraph.refid)) {
    selectedTaskIds.value.push(subgraph.refid);
  }
  if (subgraph.fullTask) {
    currentOption.value = subgraph._name;
    emit('task-selected', subgraph.fullTask.para || []);
    emitContext();
  }
};

const resetDisplay = () => {
  selectedTaskIds.value = [];
  selectedSubgraphs.value = [];
  emit('task-selected', []);
  simulatorStore.currentTaskId = null;
  currentStep.value = '';
  currentOption.value = '';
  emitContext();
};

// --- Lifecycle ---

onMounted(() => {
  langStore.loadLanguage();
  initializeTasks();
  resetOpenGroups();
});

// --- Watchers ---

watch(selectedTab, () => {
  resetOpenGroups();
  if (tabChangedFromMap.value) {
    tabChangedFromMap.value = false;
    return;
  }
  resetDisplay();
});

// On surveille le changement de terrain pour mettre à jour la météo automatiquement
watch(() => formStore.form.MET, (newIcao) => {
  if (newIcao && newIcao.length === 4) {
    weatherStore.updateMetar(newIcao);
  }
}, { immediate: true });

// Changement de niveau : réinitialiser l'affichage
watch(() => formStore.form.LEVEL, () => {
  resetDisplay();
  resetOpenGroups();
});

// Watch props change to re-init tasks if data changes (e.g. mode switch)
watch(() => props.phraseoData, () => {
  initializeTasks();
  resetDisplay();
  resetOpenGroups();
});
</script>
  
<style scoped>
/* Ajoutez des styles spécifiques si nécessaire */
</style>