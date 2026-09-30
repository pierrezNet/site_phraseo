<template>
  <div
    :class="[
      'strip w-full rounded-lg px-3 py-2 mb-3 border transition flex items-center gap-2 flex-wrap',
      highlight && 'strip--highlight'
    ]"
  >
    <span class="text-lg shrink-0">✈</span>
    <span class="flex-1 text-sm min-w-0">
      <button v-if="highlight" type="button" class="strip__invite font-semibold" @click="onEdit">👉 Personnalisez votre vol — </button>
      <!-- Chaque élément s'insère dans la réponse en cours (évite de tout retaper) -->
      <template v-for="(item, i) in items" :key="item.key">
        <span v-if="i > 0" class="opacity-70">{{ item.sep }}</span>
        <span :class="i === 0 ? 'font-medium' : 'opacity-70'">
          {{ item.label }}<button
            type="button"
            class="strip__chip"
            :title="`Insérer « ${item.insert} » dans la réponse`"
            :disabled="!item.insert"
            @mousedown.prevent
            @click="quizStore.insertIntoAnswer(item.insert)"
          >{{ item.display }}</button>
        </span>
      </template>
    </span>
    <button type="button" class="strip__edit shrink-0 text-sm font-medium whitespace-nowrap" @click="onEdit">✎ Modifier</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFormStore } from '../stores/form';
import { useWeatherStore } from '../stores/weather';
import { useLangStore } from '../stores/lang';
import { useQuizStore } from '../stores/quiz';

const emit = defineEmits(['edit']);

const formStore = useFormStore();
const weatherStore = useWeatherStore();
const langStore = useLangStore();
const quizStore = useQuizStore();

const value = (v?: string) => (v ?? '').trim();
const qnh = computed(() => weatherStore.metarQnh ?? formStore.form.QNH ?? '1013');

// Champ spécifique au mode : Niveau en IFR, Point de sortie en VFR
const isVFR = computed(() => formStore.mode === 'VFR');

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
    entry('ARR', '→ ', value(f.ARR), value(f.ARR), ' '),
    entry('POS', 'Parking ', value(f.POS)),
    // Piste insérée sous sa forme prononcée (26 Gauche / 26 Left)
    entry('RWY', 'Piste ', value(f.RWY), formStore.formatRunway(value(f.RWY), lang)),
    entry('QNH', 'QNH ', String(qnh.value)),
    entry('INF', 'Info ', value(f.INF)),
    isVFR.value ? entry('SORTIE', 'Sortie ', value(f.SORTIE)) : entry('NIV', 'Niveau ', value(f.NIV)),
  ];
});

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
