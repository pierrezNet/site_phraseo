<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal">
      <!-- Modal Content -->
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div class="flex justify-between items-center border-b pb-2">
          <h2 class="text-lg font-semibold">À propos</h2>
          <button @click="close" class="text-gray-600 hover:text-gray-800">
            &times;
          </button>
        </div>
        <div class="mt-4">
            <p><a rel="license" href="https://creativecommons.org/licenses/by/4.0/"><img alt="Licence Creative Commons" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/80x15.png"></a> <span xmlns:dct="https://purl.org/dc/terms/" property="dct:title">Phraséologie</span> de <a xmlns:cc="https://creativecommons.org/ns#" href="https://pierrez.net" property="cc:attributionName" rel="cc:attributionURL">Emmanuel Pierrez</a> pour <a href="https://aeronautique.xyz/">aeronautique.xyz</a> est mis à disposition selon les termes de la <a rel="license" href="https://creativecommons.org/licenses/by/4.0/">licence Creative Commons Attribution 4.0 International</a>. Phraséologie réalisée d'après les <a href="https://www.sia.aviation-civile.gouv.fr/">documents du SIA&nbsp;: Service d'information aéronautique</a>.</p>
            <p>L'ensemble des textes est regroupé sur un <a href="phraseologieIFR.json">fichier en langage JSON</a>. Il constitue le référentiel de phraséologie IFR.</p>
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
