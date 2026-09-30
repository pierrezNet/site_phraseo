<template>
  <div class="p-1 md:p-4">
    <!-- En-tête : vol en cours -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="min-w-0">
        <p class="text-xs uppercase tracking-wide opacity-60">Vol complet · {{ flight.level }}</p>
        <p class="font-semibold truncate">✈ {{ flight.title }}</p>
      </div>
      <button type="button" class="task-btn shrink-0 rounded-md px-3 py-1 text-sm" @click="flight.abort()">
        Quitter le vol
      </button>
    </div>

    <!-- Progression par phase -->
    <div class="flex gap-1 mb-1" role="progressbar" :aria-valuenow="doneCount" :aria-valuemax="flight.steps.length">
      <div v-for="p in flight.phaseProgress" :key="p.tab" class="flex-1 min-w-0" :style="{ flexGrow: p.total }">
        <div class="phase-bar">
          <div class="phase-bar__fill" :style="{ width: `${(p.done / p.total) * 100}%` }"></div>
        </div>
        <p class="text-[11px] mt-0.5 truncate" :class="p.current ? 'font-semibold' : 'opacity-60'">{{ phaseLabel(p.tab) }}</p>
      </div>
    </div>
    <p class="text-xs opacity-60 mb-3">Étape {{ Math.min(flight.index + 1, flight.steps.length) }} / {{ flight.steps.length }}</p>

    <!-- Frise des étapes -->
    <ol class="space-y-1">
      <li
        v-for="(step, i) in flight.steps"
        :key="i"
        :ref="(el) => { if (i === flight.index) currentEl = el as HTMLElement }"
        :class="[
          'task-btn rounded-md px-3 py-1.5 flex items-center gap-2 text-sm',
          status(i) === 'current' && 'task-btn--active',
          status(i) === 'done' && 'task-btn--done',
          status(i) === 'todo' && 'opacity-60',
          devJump && 'cursor-pointer'
        ]"
        :title="devJump ? 'Aller à cette étape (développement)' : undefined"
        @click="devJump && flight.goTo(i)"
      >
        <span class="w-4 shrink-0 text-center" :class="status(i) === 'current' ? '' : 'task-btn__check'">
          {{ status(i) === 'done' ? (flight.stepMissed(i) ? '✗' : '✓') : status(i) === 'current' ? '●' : '○' }}
        </span>
        <!-- Pas de spoiler : variante révélée une fois l'étape jouée, imprévus à venir masqués -->
        <span class="flex-1 min-w-0 truncate">
          <template v-if="step.incident && status(i) === 'todo'">Imprévu</template>
          <template v-else>
            {{ step.title }}<span v-if="step.subtitle && status(i) === 'done'" class="opacity-75"> › {{ step.subtitle }}</span>
          </template>
        </span>
        <span v-if="step.incident" class="shrink-0 text-xs" title="Imprévu">⚡</span>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useFlightStore } from '../stores/flight';
import { iconTaxonomy } from '../stores/taxonomy';

const flight = useFlightStore();

// En local uniquement : cliquer une étape de la frise y saute directement (tests)
const devJump = import.meta.env.DEV;

const phaseLabel = (tab: string) => iconTaxonomy[tab]?.label || tab;
const doneCount = computed(() => (flight.finished ? flight.steps.length : flight.index));

const status = (i: number): 'done' | 'current' | 'todo' =>
  flight.finished || i < flight.index ? 'done' : i === flight.index ? 'current' : 'todo';

// Garde l'étape courante visible dans la frise
const currentEl = ref<HTMLElement | null>(null);
watch(
  () => flight.index,
  async () => {
    await nextTick();
    currentEl.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
);
</script>
