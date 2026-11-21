<template>
  <div
    :class="[
      'strip w-full rounded-lg px-3 py-1 md:py-2 mb-1 md:mb-3 border transition flex items-center gap-2 md:flex-wrap',
      highlight && 'strip--highlight'
    ]"
  >
    <span class="hidden md:inline text-lg shrink-0">✈</span>
    <span class="flex-1 text-sm min-w-0">
      <button v-if="highlight" type="button" class="strip__invite font-semibold" @click="onEdit">{{ t('strip.invite') }}</button>
      <!-- Chaque élément s'insère dans la réponse en cours (évite de tout retaper) -->
      <template v-for="(item, i) in items" :key="item.key">
        <!-- Mobile replié : indicatif et trajet seulement -->
        <span v-if="i > 0" :class="['opacity-70', hiddenOnMobile(item) && 'max-md:hidden']">{{ item.sep }}</span>
        <span :class="[i === 0 ? 'font-medium' : 'opacity-70', hiddenOnMobile(item) && 'max-md:hidden']">
          {{ item.label }}<button
            type="button"
            class="strip__chip"
            :title="t('strip.insert', { text: item.insert })"
            :disabled="!item.insert"
            @mousedown.prevent
            @click="quizStore.insertIntoAnswer(item.insert)"
          >{{ item.display }}</button>
        </span>
      </template>
    </span>
    <!-- Mobile : deux boutons ronds calés à droite, modifier et déplier / replier -->
    <div class="md:hidden flex items-center gap-1.5 shrink-0 self-center">
      <button type="button" class="strip__round" :title="t('nav.flightParams')" :aria-label="t('nav.flightParams')" @click="onEdit">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        type="button"
        class="strip__round"
        :aria-expanded="expanded"
        :aria-label="t(expanded ? 'strip.collapse' : 'strip.expand')"
        @click="expanded = !expanded"
      >
        <svg :class="['w-4 h-4 transition-transform', expanded && 'rotate-180']" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
    <button type="button" class="hidden md:inline strip__edit shrink-0 text-sm font-medium whitespace-nowrap" @click="onEdit">{{ t('strip.edit') }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFormStore } from '../stores/form';
import { useWeatherStore } from '../stores/weather';
import { useLangStore } from '../stores/lang';
import { useQuizStore } from '../stores/quiz';
import { useFlightStore } from '../stores/flight';
import { useI18n } from '../i18n';

const emit = defineEmits(['edit']);

const { t } = useI18n();
const formStore = useFormStore();
const weatherStore = useWeatherStore();
const langStore = useLangStore();
const quizStore = useQuizStore();
const flightStore = useFlightStore();

const value = (v?: string) => (v ?? '').trim();
const qnh = computed(() => weatherStore.metarQnh ?? formStore.form.QNH ?? '1013');

// Champ spécifique au mode : Niveau en IFR, Point de sortie en VFR
const isVFR = computed(() => formStore.mode === 'VFR');
const arr = computed(() => flightStore.tagOverrides.ARR ?? value(formStore.form.ARR));

/** Vol complet en approche ou à l'arrivée : piste d'arrivée et STAR (sinon : départ et SID) */
const arriving = computed(() => flightStore.active && ['AP', 'AT'].includes(flightStore.currentStep?.tab ?? ''));
/** Piste utile maintenant ; en tours de piste, l'arrivée se fait sur la piste de départ */
const runway = computed(() => {
  const f = formStore.form;
  const local = flightStore.tagOverrides.RWYA === '[RWY]';
  return value(arriving.value && !local ? f.RWYA || f.RWY : f.RWY);
});

/** Éléments du bandeau : libellé fixe, valeur affichée, texte inséré dans la réponse */
const items = computed(() => {
  const f = formStore.form;
  const lang = langStore.current as 'fr' | 'en';
  const entry = (key: string, label: string, raw: string, insert = raw, sep = ' · ') => ({
    key,
    label,
    sep,
    display: raw || '—',
    insert: raw ? insert : '',
  });
  return [
    entry('CAL', '', value(f.CAL)),
    entry('COM', '', value(f.COM)),
    entry('DEP', '', value(f.DEP)),
    // Vol local (tours de piste) : retour au départ
    entry('ARR', '→ ', arr.value, arr.value, ' '),
    entry('POS', t('strip.parking'), value(arriving.value ? f.POSA || f.POS : f.POS)),
    // Piste insérée sous sa forme prononcée (26 Gauche / 26 Left)
    entry('RWY', t('strip.runway'), runway.value, formStore.formatRunway(runway.value, lang)),
    entry('QNH', 'QNH ', String(qnh.value)),
    entry('INF', t('strip.info'), value(f.INF)),
    ...(isVFR.value
      ? [entry('SORTIE', t('strip.exit'), value(f.SORTIE))]
      : [
          arriving.value ? entry('STAR', 'STAR ', value(f.STAR)) : entry('SID', 'SID ', value(f.SID)),
          entry('NIV', t('strip.level'), value(f.NIV)),
          entry('NIVC', t('strip.cruise'), value(f.NIVC)),
        ]),
  ];
});

/** Mobile : bandeau replié sur une ligne (indicatif, départ → arrivée), déplié au toucher */
const expanded = ref(false);
const BRIEF = ['CAL', 'DEP', 'ARR'];
const hiddenOnMobile = (item: { key: string }) => !expanded.value && !BRIEF.includes(item.key);

// Surligné tant que l'utilisateur n'a pas ouvert les paramètres depuis le bandeau
const highlight = ref(false);
onMounted(() => {
  highlight.value = !localStorage.getItem('phraseoFlightSeen');
});

const onEdit = () => {
  localStorage.setItem('phraseoFlightSeen', '1');
  highlight.value = false;
  emit('edit');
};
</script>
