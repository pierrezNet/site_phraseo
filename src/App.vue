<template>
  <div id="app">
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