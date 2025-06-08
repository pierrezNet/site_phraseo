<template>
  <div id="app">
    <Navbar @open-modal="openModal" @select-task="selectTask" />
    <div class="grid grid-cols-10 gap-4">
      <div class="col-span-12 md:col-span-4">
        <Tabs ref="tabsRef" @task-selected="updateSelectedTaskTexts" />
      </div>
      <!-- Affichage du texte sélectionné -->
      <div id="instructions" class="col-span-12 md:col-span-6 m-1 md:mt-3 md:ml-3">
        <TaskTextDisplay :selectedTaskTexts="selectedTaskTexts" />
      </div>
    </div>
    <footer class="fixed bottom-0 md:right-4 bg-white w-full md:w-1/3 modal">
        <div class="w-full mx-auto max-w-screen-xl p-1 pl-4 md:flex md:justify-between">
          <span class="text-sm text-gray-700 text-left md:text-right">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 980" width="18" height="18" class="inline align-text-bottom">
              <circle cx="490" cy="490" r="440" fill="none" stroke="currentColor" stroke-width="100"/>
              <path d="M219,428H350a150,150 0 1 1 0,125H219a275,275 0 1 0 0-125z" fill="currentColor"/>
            </svg> Copyleft <span property="dc:date" datatype="xsd:gYear">2014</span>-<span property="dc:date" datatype="xsd:gYear">{{ new Date().getFullYear() }}
            -  <a property="dc:publisher" href="https://aeronautique.xyz/">aeronautique.xyz</a>,
            <a href="https://pierrez.net/"><span property="dc:creator" resource="#me">E. Pierrez</span></a></span>
          </span>
        </div>
    </footer>

    <AideModal ref="aideModal" />
    <ParametresModal ref="parametresModal" />
    <AboutModal ref="aboutModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import type { Ref } from 'vue'; // Utiliser une importation de type pour Ref
import Navbar from './components/Navbar.vue';
import Tabs from './components/Tabs.vue';
import TaskTextDisplay from './components/TaskTextDisplay.vue';
import AideModal from './components/AideModal.vue';
import ParametresModal from './components/ParametresModal.vue';
import AboutModal from './components/AboutModal.vue';

interface Modal {
  open: () => void;
  close: () => void;
}

export default defineComponent({
  name: 'App',
  components: {
    Navbar,
    Tabs,
    TaskTextDisplay,
    AideModal,
    ParametresModal,
    AboutModal
  },
  setup() {
    const aideModal: Ref<Modal | null> = ref(null);
    const parametresModal: Ref<Modal | null> = ref(null);
    const aboutModal: Ref<Modal | null> = ref(null);

    const openModal = (modalName: string) => {
      switch (modalName) {
        case 'aide':
          aideModal.value?.open();
          break;
        case 'parametres':
          parametresModal.value?.open();
          break;
        case 'about':
          aboutModal.value?.open();
          break;
      }
    };

    const selectedTaskTexts = ref<string[]>([]);
    const tabsRef = ref(null);

    const updateSelectedTaskTexts = (texts: string[]) => {
      selectedTaskTexts.value = texts;
    };
    
    // Méthode pour sélectionner un onglet et une tâche
    const selectTask = (tabCode: string, taskId: string) => {
      if (tabsRef.value) {
        // Changer l'onglet actif
        tabsRef.value.selectedTab = tabCode;
        
        // Attendre que le changement d'onglet soit effectué
        setTimeout(() => {
          // Trouver et sélectionner la tâche correspondante
          const task = tabsRef.value.filteredPhaseTasks.find(t => t._id === taskId);
          if (task) {
            tabsRef.value.logTask(task);
          }
        }, 100);
      }
    };

    return {
      aideModal,
      parametresModal,
      aboutModal,
      openModal,
      selectedTaskTexts,
      updateSelectedTaskTexts,
      tabsRef,
      selectTask
    };
  }
});
</script>
