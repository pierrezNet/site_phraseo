<template>
  <div id="app" :class="[currentMode === 'IFR' ? 'theme-ifr' : 'theme-vfr']" class="h-[100dvh] md:h-auto md:min-h-screen flex flex-col transition-colors duration-500">
    <Navbar 
      @open-modal="openModal" 
      @select-task="selectTask" 
      @update:mode="handleModeChange" 
    />
    
    <div v-if="showFlightStrip" class="shrink-0 px-2 md:px-4 pt-2">
      <FlightStrip @edit="openModal('parametres')" />
    </div>

    <div class="flex-1 min-h-0 flex flex-col overflow-hidden md:overflow-visible md:grid md:grid-cols-10 md:gap-4">
      <div v-scroll-fade class="col-span-12 md:col-span-4 max-h-[40%] md:max-h-none overflow-y-auto md:overflow-visible scroll-fade">
        <!-- Vol complet (proposé en mode quiz) : la frise remplace les onglets (Tabs reste monté pour garder son état) -->
        <FlightPanel v-if="flight.active" />
        <div v-else-if="quizStore.enabled" class="px-1 md:px-4 pt-1 md:pt-4">
          <button type="button" class="task-btn w-full rounded-md px-3 py-1.5 text-sm font-medium" @click="flightPickerModal?.open()">
            ✈ Vol complet
          </button>
        </div>
        <Tabs
          v-show="!flight.active"
          ref="tabsRef"
          :phraseoData="currentPhraseoData"
          :currentMode="currentMode"
          @task-selected="updateSelectedTaskTexts"
          @update:context="updateContext"
        />
      </div>

      <div id="instructions" v-scroll-fade class="col-span-12 md:col-span-6 m-1 md:mt-3 md:ml-3 flex-1 min-h-0 overflow-y-auto md:overflow-visible scroll-fade">
        <FlightSummary v-if="flight.active && flight.finished" />
        <TaskTextDisplay v-else :selectedTaskTexts="displayedTexts" :context="displayedContext" />
      </div>
    </div>

    <AideModal ref="aideModal" />
    <ParametresModal ref="parametresModal" :currentMode="currentMode" />
    <AboutModal ref="aboutModal" />
    <FeedbackModal ref="feedbackModal" />
    <FlightPickerModal ref="flightPickerModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, nextTick, watch } from 'vue';
import Navbar from '@/components/Navbar.vue';
import Tabs from '@/components/Tabs.vue';
import TaskTextDisplay from '@/components/TaskTextDisplay.vue';
import AideModal from '@/components/AideModal.vue';
import ParametresModal from '@/components/ParametresModal.vue';
import AboutModal from '@/components/AboutModal.vue';
import FeedbackModal from '@/components/FeedbackModal.vue';
import FlightStrip from '@/components/FlightStrip.vue';
import FlightPanel from '@/components/FlightPanel.vue';
import FlightSummary from '@/components/FlightSummary.vue';
import FlightPickerModal from '@/components/FlightPickerModal.vue';
import { useFlightStore } from '@/stores/flight';
import { useQuizStore } from '@/stores/quiz';
import { useFormStore } from '@/stores/form';

// Import des deux bases de données
import phraseoIFR from '@/data/phraseologieIFR.json';
import phraseoVFR from '@/data/phraseologieVFR.json';

// Directive : fondu de scroll dynamique (mobile). Pose data-fade selon la
// position (top/bottom/both/none) → pas de fondu au bout du défilement.
const vScrollFade = {
  mounted(el: HTMLElement) {
    const update = () => {
      const up = el.scrollTop > 1;
      const down = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      el.dataset.fade = up && down ? 'both' : up ? 'top' : down ? 'bottom' : 'none';
    };
    (el as any)._sf = update;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    requestAnimationFrame(update);
  },
  updated(el: HTMLElement) {
    if ((el as any)._sf) requestAnimationFrame((el as any)._sf);
  },
  unmounted(el: HTMLElement) {
    const fn = (el as any)._sf;
    if (fn) {
      el.removeEventListener('scroll', fn);
      window.removeEventListener('resize', fn);
    }
  },
};

/** * 1. ON DÉFINIT UNE INTERFACE LOCALE POUR ÉVITER LE CONFLIT
 * On ne l'appelle pas TextItem, on l'appelle PhraseoLine
 */
interface PhraseoLine {
  _class: string;
  _lang: string;
  __text: string;
}

interface ModalInstance {
  open: () => void;
  close: () => void;
}

interface TabsInstance {
  selectedTab: string;
  filteredPhaseTasks: any[];
  logTask: (task: any) => void;
}

// Le mode de vol est porté par le store du formulaire (persisté dans localStorage)
const formStore = useFormStore();
const currentMode = computed(() => formStore.mode);

// Données calculées en fonction du mode
const currentPhraseoData = computed(() => {
  return currentMode.value === 'VFR' ? phraseoVFR : phraseoIFR;
});

provide('phraseoData', currentPhraseoData);

const quizStore = useQuizStore();
const flight = useFlightStore();
// Le bandeau de vol n'apparaît qu'en mode quiz ou en vol complet (rappel des paramètres)
const showFlightStrip = computed(() => quizStore.enabled || flight.active);

const handleModeChange = () => {
  selectedTaskTexts.value = [];
  // Un vol appartient à son mode : changer VFR/IFR l'interrompt
  if (flight.active) flight.abort();
};

const aideModal = ref<ModalInstance | null>(null);
const parametresModal = ref<ModalInstance | null>(null);
const aboutModal = ref<ModalInstance | null>(null);
const feedbackModal = ref<ModalInstance | null>(null);
const flightPickerModal = ref<ModalInstance | null>(null);
const tabsRef = ref<TabsInstance | null>(null);

/**
 * 2. ON UTILISE NOTRE NOUVELLE INTERFACE ICI
 */
const selectedTaskTexts = ref<PhraseoLine[]>([]);

const updateSelectedTaskTexts = (texts: any[]) => {
  selectedTaskTexts.value = texts;
};

const taskContext = ref<{ step: string; option: string }>({ step: '', option: '' });
const updateContext = (ctx: { step: string; option: string }) => {
  taskContext.value = ctx;
};

// Changer de niveau pendant un vol le relance à ce niveau (les étapes diffèrent)
watch(
  () => formStore.form.LEVEL,
  (level) => {
    if (flight.active && flight.scenario && level !== flight.level) flight.start(flight.scenario, level);
  }
);

// En vol complet, le dialogue affiché est celui de l'étape en cours
const displayedTexts = computed(() => (flight.active ? flight.currentStep?.lines ?? [] : selectedTaskTexts.value));
// En vol, la variante de l'étape en cours n'est pas annoncée : c'est la surprise de l'échange
const displayedContext = computed(() =>
  flight.active ? { step: flight.currentStep?.title ?? '', option: '' } : taskContext.value
);

const openModal = (modalName: string) => {
  if (modalName === 'aide') aideModal.value?.open();
  if (modalName === 'parametres') parametresModal.value?.open();
  if (modalName === 'about') aboutModal.value?.open();
  if (modalName === 'feedback') feedbackModal.value?.open();
};

const selectTask = (tabCode: string, taskId: string) => {
  const tabs = tabsRef.value;
  if (tabs) {
    tabs.selectedTab = tabCode;
    nextTick(() => {
      const task = tabsRef.value?.filteredPhaseTasks.find((t) => t._id === taskId);
      if (task) tabsRef.value?.logTask(task);
    });
  }
};
</script>

<style>
/* --- Styles de base pour la transition --- */
#app {
  transition: background-color 0.5s ease, color 0.3s ease;
}

/* --- THEME VFR (Classique) --- */
.theme-vfr {
  background-color: #f8fafc; /* Fond très clair */
  color: #1e293b;
}

/* --- THEME IFR (Glass Cockpit Soft) --- */
.theme-ifr {
  background-color: #0f172a; /* Slate 900 : Bleu-Noir profond */
  color: #f1f5f9; /* Texte blanc cassé */
}

/* Ajustement des titres en IFR */
.theme-ifr .custom-h2 {
  color: #38bdf8; /* Bleu ciel type instrument */
  border-bottom: 2px solid #075985;
}

/* Adaptation douce des cartes/zones de texte en IFR */
.theme-ifr #instructions > div {
  border-color: #334155;
  color: #f1f5f9;
}

/* Style des paragraphes Pilot/ATC spécifiques au mode sombre IFR */
.theme-ifr .bg-blue-100 { background-color: #1e3a8a !important; color: #dbeafe !important; }
.theme-ifr .bg-orange-100 { background-color: #3d033f !important; color: #dbeafe !important; }
.theme-ifr .bg-yellow-100 { background-color: #3d033f !important; color: #fef9c3 !important; }
.theme-ifr .border-blue-500 { border-color: #3b82f6 !important; }
.theme-ifr .border-yellow-500 { border-color: #7d0781 !important; }
.theme-ifr .border-orange-500 { border-color: #7d0781 !important; }

.theme-ifr .modal-content, 
.theme-ifr .bg-white {
  /* On remplace le fond blanc par un gris-bleu très sombre */
  background-color: #1e293b !important; 
  color: #f1f5f9 !important;
}

/* On ajuste les bordures et les headers des modales */
.theme-ifr .modal-header {
  border-bottom: 1px solid #334155;
  color: #38bdf8; /* Bleu instrument pour les titres */
}

.theme-ifr .modal-footer {
  border-top: 1px solid #334155;
}

.theme-ifr .label-field {
  color: #cccccc;
}

/* Inversion des inputs et champs de saisie dans les modales */
.theme-ifr input, 
.theme-ifr select, 
.theme-ifr textarea {
  background-color: #0f172a !important;
  color: #f1f5f9 !important;
  border: 1px solid #334155 !important;
}

/* Style des boutons "Fermer" ou "Valider" dans la modale */
.theme-ifr .modal-footer button {
  border-color: #334155;
}
.theme-ifr .bg-white svg {
  fill: #ffffff !important;
  color: #ffffff !important; /* Pour couvrir les deux modes de coloration possibles */
}

</style>