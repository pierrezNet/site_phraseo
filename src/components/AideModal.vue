<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal">
      <!-- Modal Content -->
      <div ref="scroller" class="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center border-b pb-2">
          <h4 class="text-lg font-semibold">Aide</h4>
          <button @click="close" class="text-gray-600 hover:text-gray-800" aria-label="Fermer l'aide">
            &times;
          </button>
        </div>

        <!-- Sommaire : reste visible pendant le défilement -->
        <nav ref="toc" aria-label="Sommaire de l'aide" class="sticky -top-6 z-10 bg-white -mx-6 px-6 pt-3 pb-2 border-b">
          <!-- Une seule ligne ; sur petit écran, elle défile horizontalement -->
          <ul class="flex flex-nowrap gap-1.5 text-xs overflow-x-auto whitespace-nowrap">
            <li v-for="s in SECTIONS" :key="s.id">
              <button type="button" class="px-2 py-1 rounded border hover:bg-blue-500/10" @click="goTo(s.id)">{{ s.title }}</button>
            </li>
          </ul>
        </nav>

        <div class="mt-4 space-y-3 text-sm">
          <p>Ce projet est un outil d'entraînement à la phraséologie aéronautique, conçu pour les pilotes virtuels VFR et IFR, en français et en anglais, d'après le manuel de phraséologie de la DGAC.</p>

          <h3 id="aide-utilisation" class="font-semibold text-base mt-4">Prise en main</h3>
          <p>Le bouton de règle de vol bascule entre les modes VFR et IFR&nbsp;; choisissez aussi la langue des échanges entre le pilote et l'ATC.</p>
          <p>Renseignez votre vol (menu <strong>Paramètres</strong>), cliquez sur une phase de vol puis sur la tâche correspondante&nbsp;: les textes de phraséologie s'affichent avec les données de votre vol.</p>

          <h3 id="aide-niveaux" class="font-semibold text-base mt-4">Niveaux</h3>
          <p>Sélectionnez votre niveau (boutons <strong>Déb</strong> / <strong>Int</strong> / <strong>Av</strong>)&nbsp;:</p>
          <ul class="list-disc ml-5 space-y-1">
            <li><strong>Débutant</strong>&nbsp;: phraséologie essentielle pour un vol standard (mise en route, roulage, décollage, circuit, atterrissage). Les situations complexes sont masquées.</li>
            <li><strong>Intermédiaire</strong>&nbsp;: toutes les situations courantes (CTOT, trafic, remise de gaz, approches spéciales, transit, décollage immédiat…).</li>
            <li><strong>Avancé</strong>&nbsp;: phraséologie hors des situations courantes (chapitre 5 du manuel DGAC&nbsp;: coordination, situations rares…).</li>
          </ul>
          <p>Le nombre de tâches et d'options s'adapte automatiquement au niveau choisi.</p>

          <h3 id="aide-icones" class="font-semibold text-base mt-4">Icônes</h3>
          <ul class="list-disc ml-5 space-y-1">
            <li>Avion&nbsp;: le <strong>pilote</strong> initie l'échange (sur une réplique&nbsp;: écouter le pilote)</li>
            <li>Micro&nbsp;: l'<strong>ATC</strong> initie l'échange (sur une réplique&nbsp;: écouter l'ATC)</li>
            <li>Chevron <strong>&gt;</strong>&nbsp;: ouvre un choix de sous-options</li>
          </ul>

          <h3 id="aide-quiz" class="font-semibold text-base mt-4">Mode quiz</h3>
          <ul class="list-disc ml-5 space-y-1">
            <li>Bouton <strong>Quiz</strong> de la barre&nbsp;: les répliques du pilote sont masquées, à vous de les dire ou de les écrire.</li>
            <li>Une réponse est <strong>validée</strong> si tous les éléments critiques sont justes (indicatif, piste, QNH, fréquence, niveau, transpondeur…) <strong>et</strong> si le score atteint 75 %. Les formules de politesse ne comptent pas.</li>
            <li>«&nbsp;Roger&nbsp;» seul à la place d'un collationnement est toujours faux&nbsp;; les autres écarts de phraséologie sont signalés en débriefing (💬) sans faire échouer la réponse.</li>
            <li>Après un refus, <strong>Réessayer</strong>&nbsp;; après correction, la réponse attendue s'affiche.</li>
          </ul>

          <h3 id="aide-vol" class="font-semibold text-base mt-4">Vol complet</h3>
          <ul class="list-disc ml-5 space-y-1">
            <li>En mode quiz, le bouton <strong>Vol complet</strong> enchaîne toutes les étapes d'un vol, de la mise en route au parking, au niveau choisi.</li>
            <li>Une <strong>consigne</strong> indique la décision du pilote à chaque étape&nbsp;; des <strong>imprévus</strong> (⚡) peuvent survenir.</li>
            <li><strong>Deux essais</strong> par réplique&nbsp;; si l'intention manque, l'ATC vous relance.</li>
            <li>Le bandeau du vol rappelle vos paramètres&nbsp;: un clic insère la valeur dans votre réponse.</li>
            <li>À la fin, un <strong>bilan</strong> par phase et un débriefing des erreurs.</li>
          </ul>

          <h3 id="aide-voix" class="font-semibold text-base mt-4">Écouter et parler</h3>
          <ul class="list-disc ml-5 space-y-1">
            <li>Cliquez sur l'icône <strong>micro</strong> d'une réplique pour écouter l'ATC, sur l'icône <strong>avion</strong> pour écouter le pilote. Un nouveau clic arrête la lecture.</li>
            <li>Touche <strong>R</strong>&nbsp;: réécoute (ou arrête) la dernière réplique de l'ATC.</li>
            <li>En mode quiz, <strong>maintenez Espace</strong> (ou le bouton «&nbsp;🎙 Maintenir pour parler&nbsp;», ou l'icône avion) pendant que vous parlez, relâchez pour envoyer&nbsp;: votre réponse s'affiche («&nbsp;Entendu&nbsp;: …&nbsp;») et est notée aussitôt. 15 secondes maximum&nbsp;; le navigateur demande l'accès au micro la première fois.</li>
            <li>Dans la zone de réponse, Espace sert à parler tant qu'elle est vide&nbsp;; dès que vous tapez, Espace écrit normalement (et R aussi).</li>
            <li>Sur mobile, en mode quiz, on répond à la voix&nbsp;: maintenez le bouton «&nbsp;🎙 Maintenir pour parler&nbsp;», attendez «&nbsp;● ÉMISSION&nbsp;», parlez, relâchez. Si le micro est refusé ou le quota atteint, la saisie au clavier revient.</li>
            <li>Après correction, l'icône avion fait écouter la réponse attendue.</li>
            <li>Bouton <strong>🔊 ON/OFF</strong> de la barre&nbsp;: en vol complet, l'ATC parle automatiquement. Au survol&nbsp;: part du quota voix restante aujourd'hui.</li>
            <li>Voix de synthèse avec effet radio&nbsp;; la voix et la reconnaissance ont un quota quotidien, les textes restent toujours disponibles.</li>
          </ul>

          <h3 id="aide-carte" class="font-semibold text-base mt-4">Carte interactive</h3>
          <p>En mode VFR débutant sur ordinateur, une carte du circuit de piste remplace les boutons. Cliquez sur un point numéroté pour afficher la phraséologie correspondante&nbsp;; la phase de vol s'adapte automatiquement.</p>

          <h3 id="aide-meteo" class="font-semibold text-base mt-4">Météo</h3>
          <p>Renseignez le code OACI dans les paramètres (ex&nbsp;: LFPO). Le QNH et les informations météo sont récupérés automatiquement depuis le METAR en temps réel.</p>

          <h3 id="aide-sauvegarde" class="font-semibold text-base mt-4">Sauvegarde</h3>
          <p>Les paramètres de vol, le niveau et le réglage de la voix (🔊 ON/OFF) sont stockés sur votre appareil&nbsp;: vous les retrouvez d'une session à l'autre. Le détail des données envoyées au relais (voix, météo, quota) figure dans <strong>À propos</strong>.</p>
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

<script setup lang="ts">
import { ref } from 'vue';

const SECTIONS = [
  { id: 'aide-utilisation', title: 'Prise en main' },
  { id: 'aide-niveaux', title: 'Niveaux' },
  { id: 'aide-icones', title: 'Icônes' },
  { id: 'aide-quiz', title: 'Mode quiz' },
  { id: 'aide-vol', title: 'Vol complet' },
  { id: 'aide-voix', title: 'Écouter et parler' },
  { id: 'aide-carte', title: 'Carte' },
  { id: 'aide-meteo', title: 'Météo' },
  { id: 'aide-sauvegarde', title: 'Sauvegarde' },
] as const;

const isOpen = ref(false);
const scroller = ref<HTMLElement | null>(null);
const toc = ref<HTMLElement | null>(null);

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

/** Navigation interne : défilement dans la modale (titre juste sous le sommaire collant), sans changer l'adresse */
const goTo = (id: string) => {
  const box = scroller.value;
  const target = box?.querySelector<HTMLElement>(`#${id}`);
  if (!box || !target) return;
  const offset = (toc.value?.offsetHeight ?? 0) + 12;
  const top = box.scrollTop + target.getBoundingClientRect().top - box.getBoundingClientRect().top - offset;
  box.scrollTo({ top, behavior: 'smooth' });
};

defineExpose({ open, close });
</script>
