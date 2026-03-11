<template>
  <div class="m-1 md:space-y-4 md:pr-6">
    <h2 class="hidden md:block custom-h2">Dialogues</h2>
    <div
      v-for="(textObj, index) in renderedTexts"
      :key="index"
      :class="[
        'w-full p-4 rounded-md py-2 mb-4 shadow transition border-l-4',
        textObj.class === 'Pilot' ? 'bg-blue-100 border-blue-500' : 'bg-orange-100 border-orange-500'
      ]"
    >
      <span
        v-if="textObj.icon"
        v-html="textObj.icon"
        class="inline-block w-5 h-5 mr-2 align-middle"
      ></span>
      <span v-html="textObj.content"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { useWeatherStore } from '../stores/weather';
import { replacePlaceholders } from '../utils/phraseoHelpers';

const props = defineProps<{
  selectedTaskTexts: any[]
}>();

const formStore = useFormStore();
const langStore = useLangStore();
const weatherStore = useWeatherStore();

const hasMetTag = computed(() =>
  props.selectedTaskTexts.some(t => t.__text?.includes('[MET]'))
);

const checkMetarRefresh = () => {
  if (hasMetTag.value && formStore.form.MET) {
    weatherStore.updateMetar(formStore.form.MET);
  }
};

onMounted(checkMetarRefresh);
watch(() => props.selectedTaskTexts, checkMetarRefresh);

const renderedTexts = computed(() => {
  const lang = langStore.current as 'fr' | 'en';

  return props.selectedTaskTexts
    .filter(t => t._lang === lang)
    .map(item => {
      let processed = replacePlaceholders(item.__text, lang, formStore, weatherStore);

      // Remplacement des tooltips {note}
      processed = processed.replace(/\{([^}]+)\}/g, (_match, note: string) => {
        return `<span class="relative inline-block">
        <button type="button" class="text-blue-400 underline decoration-dotted cursor-help focus:outline-none"
          onclick="this.nextElementSibling.classList.toggle('hidden')"
          onblur="setTimeout(() => this.nextElementSibling.classList.add('hidden'), 150)">ℹ️</button>
        <div class="hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 w-max max-w-xs break-words">
          <div class="whitespace-normal">${note}</div>
          <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      </span>`;
      });

      return {
        content: processed,
        class: item._class,
        icon: item.icon
      };
    });
});
</script>