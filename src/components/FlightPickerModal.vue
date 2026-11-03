<template>
  <div>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal">
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center border-b pb-2">
          <h2 class="text-lg font-semibold">{{ t('flight.full') }}</h2>
          <button @click="close" class="text-gray-600 hover:text-gray-800">&times;</button>
        </div>

        <p class="mt-3 text-sm opacity-80">
          {{ t('flight.pickerIntro', { n: MAX_ATTEMPTS }) }}
        </p>

        <!-- Niveau du vol (le même que celui de la barre du haut) -->
        <div class="mt-4 flex items-center gap-2" role="radiogroup" :aria-label="t('flight.levelAria')">
          <span class="text-sm font-medium">{{ t('pref.level') }} :</span>
          <button
            v-for="l in LEVEL_OPTIONS"
            :key="l.value"
            type="button"
            role="radio"
            :aria-checked="formStore.form.LEVEL === l.value"
            :class="['task-btn rounded-md px-3 py-1 text-sm', formStore.form.LEVEL === l.value && 'task-btn--active']"
            @click="formStore.setLevel(l.value)"
          >
            {{ t(`level.${l.value}`) }}
          </button>
        </div>

        <div class="mt-4 space-y-2">
          <button
            v-for="sc in scenarios"
            :key="sc.id"
            type="button"
            class="task-btn w-full text-left rounded-md px-3 py-2"
            @click="takeOff(sc)"
          >
            <span class="block font-medium">✈ {{ scenarioName(sc.name, formStore.form) }}</span>
            <span v-if="sc.description" class="block text-sm opacity-75">{{ sc.description }}</span>
          </button>
          <p v-if="!scenarios.length" class="text-sm opacity-75">{{ t('flight.none', { mode: formStore.mode }) }}</p>
        </div>

        <div class="mt-6 flex justify-end">
          <button @click="close" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">{{ t('common.cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFormStore, LEVEL_OPTIONS } from '../stores/form';
import { useFlightStore, SCENARIOS, MAX_ATTEMPTS } from '../stores/flight';
import { scenarioName, type Scenario } from '../utils/flight';
import { useI18n } from '../i18n';

const { t } = useI18n();

const formStore = useFormStore();
const flightStore = useFlightStore();

const isOpen = ref(false);
const scenarios = computed(() => SCENARIOS.filter((sc) => sc.mode === formStore.mode));

const open = () => {
  isOpen.value = true;
};
const close = () => {
  isOpen.value = false;
};

const takeOff = (sc: Scenario) => {
  flightStore.start(sc, formStore.form.LEVEL);
  close();
};

defineExpose({ open, close });
</script>
