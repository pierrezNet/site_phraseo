import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSimulatorStore = defineStore('simulator', () => {
  const currentTaskId = ref<string | null>(null);
  const lastTranscriptTaskId = ref<string | null>(null);

  return { currentTaskId, lastTranscriptTaskId };
});
