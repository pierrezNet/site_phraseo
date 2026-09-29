<template>
  <!-- Options (subgraph) de la tâche active -->
  <div class="flex flex-wrap md:grid md:grid-cols-1 gap-1 mt-1">
    <h2 class="custom-h2 hidden md:flex w-full">Options</h2>
    <button
      v-for="subgraph in subgraphs"
      :key="subgraph.refid"
      :class="[
        'task-btn md:w-full rounded-md px-3 py-1.5 my-1 md:p-2 md:mb-2 md:flex md:items-center md:text-center',
        subgraph.refid === currentTaskId
          ? 'task-btn--active'
          : selectedTaskIds.includes(subgraph.refid) && 'task-btn--done'
      ]"
      @click="emit('select', subgraph)"
    >
      <PilotIcon v-if="initiator(subgraph.fullTask) === 'Pilot'" class="hidden md:block w-5 h-5 shrink-0" />
      <AtcIcon v-else-if="initiator(subgraph.fullTask) === 'ATC'" class="hidden md:block w-5 h-5 shrink-0" />
      <span v-else class="hidden md:block w-5 h-5 shrink-0"></span>
      <span class="hidden md:inline flex-1">{{ subgraph._name }}</span>
      <span class="inline md:hidden whitespace-nowrap">{{ subgraph._short }}</span>
      <span v-if="selectedTaskIds.includes(subgraph.refid)" class="task-btn__check hidden md:block w-4 shrink-0">✓</span>
      <span v-else class="hidden md:block w-4 shrink-0"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import PilotIcon from './icons/PilotIcon.vue';
import AtcIcon from './icons/AtcIcon.vue';

interface Subgraph {
  refid: string;
  _name: string;
  _short: string;
  fullTask?: { para?: { _lang: string; _class: string }[] };
}

defineProps<{
  subgraphs: Subgraph[];
  selectedTaskIds: string[];
  currentTaskId: string | null;
}>();

const emit = defineEmits<{ select: [subgraph: Subgraph] }>();

/** Qui ouvre l'échange (première réplique FR) : Pilot, ATC ou rien */
const initiator = (task?: Subgraph['fullTask']): string =>
  task?.para?.find((p) => p._lang === 'fr')?._class || '';
</script>
