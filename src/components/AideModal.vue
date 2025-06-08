<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal">
      <!-- Modal Content -->
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div class="flex justify-between items-center border-b pb-2">
          <h4 class="text-lg font-semibold">Aide</h4>
          <button @click="close" class="text-gray-600 hover:text-gray-800">
            &times;
          </button>
        </div>
        <div class="mt-4">
          <p>Modifiez le formulaire (menu Paramètres), cliquez sur une phase de vol et la tâche qui correspond à votre choix. Au fur et à mesure de votre vol, modifiez les données du formulaire comme l'altitude, le cap, la fréquence d'une position etc.</p>
          <p>Les données du formulaire sont stockées en local. Cela évite de modifier vos données personnelles comme votre indicatif d'appel entre deux sessions…</p>
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
  name: 'AideModal',
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
