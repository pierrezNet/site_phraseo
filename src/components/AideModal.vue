<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal">
      <!-- Modal Content -->
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center border-b pb-2">
          <h4 class="text-lg font-semibold">Aide</h4>
          <button @click="close" class="text-gray-600 hover:text-gray-800">
            &times;
          </button>
        </div>
        <div class="mt-4 space-y-3 text-sm">
          <p>Ce projet est un outil d'entraînement à la phraséologie aéronautique, conçu pour les pilotes virtuels VFR et IFR.</p>
          <h3 class="font-semibold text-base mt-4">Utilisation</h3>
          <p>Le toggle de règle de vol permet de basculer entre les modes de vol VFR et IFR.</p>
          <p>Choisissez la langue souhaitée pour les échanges entre le pilote et l'ATC.</p>
          <p>Modifiez le formulaire (menu <strong>Paramètres</strong>), cliquez sur une phase de vol puis sur la tâche correspondante. Les textes de phraséologie s'affichent avec les données de votre vol.</p>

          <h3 class="font-semibold text-base">Niveau d'apprentissage</h3>
          <p>Sélectionnez votre niveau (boutons <strong>Déb</strong> / <strong>Int</strong>) :</p>
          <ul class="list-disc ml-5 space-y-1">
            <li><strong>Débutant</strong> : phraséologie essentielle pour un vol standard (mise en route, roulage, décollage, circuit, atterrissage). Les situations complexes sont masquées.</li>
            <li><strong>Intermédiaire</strong> : toutes les situations courantes (CTOT, trafic, remise de gaz, approches spéciales, transit, décollage immédiat...).</li>
            <li><strong>Avancé</strong> : à venir.</li>
          </ul>
          <p>Le nombre de tâches et d'options s'adapte automatiquement au niveau choisi.</p>

          <h3 class="font-semibold text-base mt-4">Icônes des boutons</h3>
          <ul class="list-disc ml-5 space-y-1">
            <li>Avion : le <strong>pilote</strong> initie l'échange</li>
            <li>Micro : l'<strong>ATC</strong> initie l'échange</li>
            <li>Chevron <strong>&gt;</strong> : ouvre un choix de sous-options</li>
          </ul>

          <h3 class="font-semibold text-base mt-4">Carte interactive (VFR débutant)</h3>
          <p>En mode VFR débutant sur desktop, une carte du circuit de piste remplace les boutons. Cliquez sur un point numéroté pour afficher la phraséologie correspondante. La phase de vol s'adapte automatiquement.</p>

          <h3 class="font-semibold text-base mt-4">Données météo</h3>
          <p>Renseignez le code OACI dans les paramètres (ex : LFPO). Le QNH et les informations météo sont récupérés automatiquement depuis le METAR en temps réel.</p>

          <h3 class="font-semibold text-base mt-4">Sauvegarde</h3>
          <p>Les données du formulaire et le niveau choisi sont stockés en local. Vous retrouvez vos paramètres entre deux sessions.</p>
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
