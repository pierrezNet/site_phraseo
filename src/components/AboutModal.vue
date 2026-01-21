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
            <p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer"><img alt="Licence Creative Commons" src="https://i.creativecommons.org/l/by/4.0/80x15.png"></a> <span xmlns:dct="https://purl.org/dc/terms/" property="dct:title">Phraséologie</span> de <a xmlns:cc="https://creativecommons.org/ns#" href="https://pierrez.net" property="cc:attributionName" target="_blank" rel="cc:attributionURL noopener noreferrer">Emmanuel Pierrez</a> pour <a href="https://aeronautique.xyz/" target="_blank" rel="noopener noreferrer">aeronautique.xyz</a> est mis à disposition selon les termes de la <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">licence Creative Commons Attribution 4.0 International</a>. Phraséologie réalisée d'après les <a href="https://www.sia.aviation-civile.gouv.fr/" target="_blank" rel="noopener noreferrer">documents du SIA&nbsp;: Service d'information aéronautique</a>.</p>
            <p>L'ensemble des textes est regroupé sur deux <a href="https://github.com/pierrezNet/site_phraseo/tree/main/src/data" target="_blank" rel="noopener noreferrer">fichiers en langage JSON</a>. Ils constituent le référentiel de phraséologie aéronautiqe.</p>
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
