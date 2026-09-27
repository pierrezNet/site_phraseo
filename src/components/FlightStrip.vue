<template>
  <button
    type="button"
    @click="onEdit"
    :class="[
      'w-full text-left rounded-lg px-3 py-2 mb-3 border transition flex items-center gap-2 flex-wrap',
      highlight
        ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300'
        : 'bg-white border-gray-300 hover:bg-gray-50'
    ]"
    :title="'Cliquez pour modifier les paramètres de votre vol'"
  >
    <span class="text-lg shrink-0">✈</span>
    <span class="flex-1 text-sm min-w-0">
      <span v-if="highlight" class="font-semibold text-yellow-800">👉 Personnalisez votre vol — </span>
      <span class="font-medium">{{ callsign }}</span>
      <span class="opacity-70"> · {{ type }}</span>
      <span class="opacity-70"> · {{ dep }} → {{ arr }}</span>
      <span class="opacity-70"> · Parking {{ pos }}</span>
      <span class="opacity-70"> · Piste {{ rwy }}</span>
      <span class="opacity-70"> · QNH {{ qnh }}</span>
      <span class="opacity-70"> · Info {{ inf }}</span>
      <span class="opacity-70"> · {{ extraLabel }} {{ extraValue }}</span>
    </span>
    <span class="shrink-0 text-sm text-blue-600 font-medium whitespace-nowrap">✎ Modifier</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFormStore } from '../stores/form';
import { useWeatherStore } from '../stores/weather';

const emit = defineEmits(['edit']);

const formStore = useFormStore();
const weatherStore = useWeatherStore();

const orDash = (v?: string) => (v && v.trim() ? v : '—');

const callsign = computed(() => orDash(formStore.form.CAL));
const type = computed(() => orDash(formStore.form.COM));
const dep = computed(() => orDash(formStore.form.DEP));
const arr = computed(() => orDash(formStore.form.ARR));
const pos = computed(() => orDash(formStore.form.POS));
const rwy = computed(() => orDash(formStore.form.RWY));
const inf = computed(() => orDash(formStore.form.INF));

// Champ spécifique au mode : Niveau en IFR, Point de sortie en VFR
const isVFR = computed(() => formStore.mode === 'VFR');
const extraLabel = computed(() => (isVFR.value ? 'Sortie' : 'Niveau'));
const extraValue = computed(() => orDash(isVFR.value ? formStore.form.SORTIE : formStore.form.NIV));
const qnh = computed(() => weatherStore.metarQnh ?? formStore.form.QNH ?? '1013');

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
