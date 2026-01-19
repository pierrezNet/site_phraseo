<template>
  <div id="app" :class="[currentMode === 'IFR' ? 'theme-ifr' : 'theme-vfr']" class="min-h-screen transition-colors duration-500">
    <Navbar 
      @open-modal="openModal" 
      @select-task="selectTask" 
      @update:mode="handleModeChange" 
    />
    
    <div class="grid grid-cols-10 gap-4">
      <div class="col-span-12 md:col-span-4">
        <Tabs 
          ref="tabsRef" 
          :phraseoData="currentPhraseoData"
          @task-selected="updateSelectedTaskTexts" 
        />
      </div>
      
      <div id="instructions" class="col-span-12 md:col-span-6 m-1 md:mt-3 md:ml-3">
        <TaskTextDisplay :selectedTaskTexts="selectedTaskTexts" />
      </div>
    </div>

    <AideModal ref="aideModal" />
    <ParametresModal ref="parametresModal" />
    <AboutModal ref="aboutModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue';
import Navbar from '@/components/Navbar.vue';
import Tabs from '@/components/Tabs.vue';
import TaskTextDisplay from '@/components/TaskTextDisplay.vue';
import AideModal from '@/components/AideModal.vue';
import ParametresModal from '@/components/ParametresModal.vue';
import AboutModal from '@/components/AboutModal.vue';

// Import des deux bases de données
import phraseoIFR from '@/data/phraseologieIFR.json';
import phraseoVFR from '@/data/phraseologieVFR.json';

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

// État réactif du mode
const currentMode = ref(localStorage.getItem('flightMode') || 'IFR');

// Données calculées en fonction du mode
const currentPhraseoData = computed(() => {
  return currentMode.value === 'VFR' ? phraseoVFR : phraseoIFR;
});

provide('phraseoData', currentPhraseoData);

const handleModeChange = (newMode: string) => {
  currentMode.value = newMode;
  selectedTaskTexts.value = [];
};

const aideModal = ref<ModalInstance | null>(null);
const parametresModal = ref<ModalInstance | null>(null);
const aboutModal = ref<ModalInstance | null>(null);
const tabsRef = ref<TabsInstance | null>(null);

/**
 * 2. ON UTILISE NOTRE NOUVELLE INTERFACE ICI
 */
const selectedTaskTexts = ref<PhraseoLine[]>([]);

const updateSelectedTaskTexts = (texts: any[]) => {
  selectedTaskTexts.value = texts;
};

const openModal = (modalName: string) => {
  if (modalName === 'aide') aideModal.value?.open();
  if (modalName === 'parametres') parametresModal.value?.open();
  if (modalName === 'about') aboutModal.value?.open();
};

const selectTask = (tabCode: string, taskId: string) => {
  const tabs = tabsRef.value;
  if (tabs) {
    tabs.selectedTab = tabCode;
    setTimeout(() => {
      if (tabsRef.value) {
        const task = tabsRef.value.filteredPhaseTasks.find((t) => t._id === taskId);
        if (task) tabsRef.value.logTask(task);
      }
    }, 100);
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

/* Optionnel : changer aussi la couleur de la bordure du bouton actif pour qu'elle soit plus visible */
.theme-ifr .bg-white.border-gray-300 {
  background-color: #334155 !important; /* Gris-bleu Slate 700 au lieu du blanc pur */
}
</style>