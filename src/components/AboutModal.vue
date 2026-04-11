<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal">
      <!-- Modal Content -->
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div class="flex justify-between items-center border-b pb-2">
          <h2 class="text-lg font-semibold">À propos</h2>
          <button @click="close" class="text-gray-600 hover:text-gray-800">
            &times;
          </button>
        </div>
        <div class="mt-4">
            <p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer"><img alt="Licence Creative Commons" src="https://i.creativecommons.org/l/by/4.0/80x15.png"></a> <span xmlns:dct="https://purl.org/dc/terms/" property="dct:title">Phraséologie aéronautique pour les pilotes virtuels</span> est l'une des applications proposées par <a xmlns:cc="https://creativecommons.org/ns#" href="https://pierrez.net" property="cc:attributionName" target="_blank" rel="cc:attributionURL noopener noreferrer">Emmanuel Pierrez</a> publiées sur <a href="https://aeronautique.xyz/" target="_blank" rel="noopener noreferrer">aeronautique.xyz</a>. Cette dernière est mise à disposition selon les termes de la <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">licence Creative Commons Attribution 4.0 International</a>. Phraséologie réalisée d’après le Manuel de phraséologie à l’usage de la circulation aérienne générale.</p>
            <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/Manuel_Phras%C3%A9ologie.pdf" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 mt-3 p-3 border rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-10 h-10 shrink-0 text-red-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H14a1 1 0 0 1-1-1V3.5zM9.5 13.5c0-.28.22-.5.5-.5h1c.83 0 1.5.67 1.5 1.5S11.83 16 11 16h-.5v1a.5.5 0 0 1-1 0v-3.5zm1 1.5h.5a.5.5 0 0 0 0-1h-.5v1zm3.5-1.5c0-.28.22-.5.5-.5h.5a1.5 1.5 0 0 1 0 3h-.5a.5.5 0 0 1-.5-.5v-2zm1 .5v1h.5a.5.5 0 0 0 0-1H15zM6.5 13a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-1H5.5a.5.5 0 0 1 0-1H6v-.5H5.5a.5.5 0 0 1 0-1h1z"/>
              </svg>
              <div class="flex flex-col">
                <span class="text-sm font-medium">Télécharger le Manuel de phraséologie</span>
                <span class="text-xs text-gray-500">PDF — 2,6 Mo — À jour au 15 avril 2023</span>
              </div>
            </a>
            <p>Ces textes sont regroupés sur deux <a href="https://github.com/pierrezNet/site_phraseo/tree/main/src/data" target="_blank" rel="noopener noreferrer">fichiers en langage JSON</a>. Ils constituent le référentiel de phraséologie aéronautique.</p>
            <h3 class="text-lg font-semibold mt-3">Utilisation</h3>
            <p>Aucune information saisie dans ce formulaire n'est envoyée sur le réseau. Aucune exploitation n'est faite de vos adresses IP. Le service de phraséologie peut être utilisé librement mais il convient de le réserver à la simulation de vol.</p>
		    </div>
        <div class="mt-6 flex justify-end">
          <button @click="close" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'AboutModal',
  setup() {
    const isOpen = ref(false);

    const open = () => {
      isOpen.value = true;
    };

    const close = () => {
      isOpen.value = false;
    };

    return {
      isOpen,
      open,
      close
    };
  }
});
</script>

<style scoped>
/* Ajouter des styles spécifiques au composant si nécessaire */
</style>
