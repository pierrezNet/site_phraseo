<template>
  <div class="m-1 md:pr-6 space-y-4">
    <h2 class="custom-h2">Bilan du vol</h2>

    <div class="notice rounded p-4">
      <p class="font-semibold">✈ {{ flight.title }} · {{ flight.level }}</p>
      <p class="mt-1 text-sm">
        Répliques validées : <strong>{{ summary.passed }} / {{ summary.total }}</strong>
        · score moyen <strong>{{ summary.score }} %</strong>
      </p>
    </div>

    <div v-if="summary.byPhase.length">
      <h3 class="font-semibold mb-2">Par phase</h3>
      <ul class="space-y-1 text-sm">
        <li v-for="p in summary.byPhase" :key="p.tab" class="flex items-center gap-2">
          <span class="w-28 shrink-0">{{ phaseLabel(p.tab) }}</span>
          <div class="phase-bar flex-1"><div class="phase-bar__fill" :style="{ width: `${(p.passed / p.total) * 100}%` }"></div></div>
          <span class="w-12 text-right shrink-0">{{ p.passed }}/{{ p.total }}</span>
        </li>
      </ul>
    </div>

    <div v-if="summary.remarks.length">
      <h3 class="font-semibold mb-2">Débriefing</h3>
      <ul class="space-y-3 text-sm">
        <li v-for="r in summary.remarks" :key="r.code">
          <p class="font-medium">💬 {{ r.title }} <span class="opacity-70 font-normal">— {{ r.count }} fois ({{ r.steps.join(', ') }})</span></p>
          <p class="opacity-80 mt-0.5">{{ r.advice }}</p>
        </li>
      </ul>
    </div>

    <div>
      <h3 class="font-semibold mb-2">Éléments critiques à revoir</h3>
      <p v-if="!summary.missed.length" class="text-sm">Aucun : tous les éléments critiques ont été collationnés. 👏</p>
      <ul v-else class="text-sm space-y-1">
        <li v-for="m in summary.missed" :key="m.label + m.value">
          <span class="ko-text">✗</span> {{ m.label }} : <strong>{{ m.value }}</strong>
          <span class="opacity-70"> — {{ m.count }} fois ({{ m.steps.join(', ') }})</span>
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-2 pt-2">
      <button type="button" class="task-btn task-btn--active rounded-md px-4 py-2" @click="flight.restart()">Refaire ce vol</button>
      <button type="button" class="task-btn rounded-md px-4 py-2" @click="flight.abort()">Terminer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFlightStore } from '../stores/flight';
import { iconTaxonomy } from '../stores/taxonomy';

const flight = useFlightStore();
const summary = computed(() => flight.summary);
const phaseLabel = (tab: string) => iconTaxonomy[tab]?.label || tab;
</script>
