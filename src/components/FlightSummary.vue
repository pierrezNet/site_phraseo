<template>
  <div class="m-1 md:pr-6 space-y-4">
    <h2 class="custom-h2">{{ t('summary.title') }}</h2>

    <div class="notice rounded p-4">
      <p class="font-semibold">✈ {{ flight.title }} · {{ levelLabel }}</p>
      <p class="mt-1 text-sm">
        {{ t('summary.passed') }}<strong>{{ summary.passed }} / {{ summary.total }}</strong>
        · {{ t('summary.average') }} <strong>{{ summary.score }} %</strong>
      </p>
    </div>

    <div v-if="summary.byPhase.length">
      <h3 class="font-semibold mb-2">{{ t('summary.byPhase') }}</h3>
      <ul class="space-y-1 text-sm">
        <li v-for="p in summary.byPhase" :key="p.tab" class="flex items-center gap-2">
          <span class="w-28 shrink-0">{{ phaseLabel(p.tab) }}</span>
          <div class="phase-bar flex-1"><div class="phase-bar__fill" :style="{ width: `${(p.passed / p.total) * 100}%` }"></div></div>
          <span class="w-12 text-right shrink-0">{{ p.passed }}/{{ p.total }}</span>
        </li>
      </ul>
    </div>

    <div v-if="summary.remarks.length">
      <h3 class="font-semibold mb-2">{{ t('summary.debrief') }}</h3>
      <ul class="space-y-3 text-sm">
        <li v-for="r in summary.remarks" :key="r.code">
          <p class="font-medium">💬 {{ remarkText(r.code, lang.ui).title }} <span class="opacity-70 font-normal">— {{ t('summary.times', { n: r.count }) }} ({{ r.steps.join(', ') }})</span></p>
          <p class="opacity-80 mt-0.5">{{ remarkText(r.code, lang.ui).advice }}</p>
        </li>
      </ul>
    </div>

    <div>
      <h3 class="font-semibold mb-2">{{ t('summary.missed') }}</h3>
      <p v-if="!summary.missed.length" class="text-sm">{{ t('summary.noneMissed') }}</p>
      <ul v-else class="text-sm space-y-1">
        <li v-for="m in summary.missed" :key="m.label + m.value">
          <span class="ko-text">✗</span> {{ criticalLabel(m.label, lang.ui) }} : <strong>{{ m.value }}</strong>
          <span class="opacity-70"> — {{ t('summary.times', { n: m.count }) }} ({{ m.steps.join(', ') }})</span>
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-2 pt-2">
      <button type="button" class="task-btn task-btn--active rounded-md px-4 py-2" @click="flight.restart()">{{ t('summary.again') }}</button>
      <button type="button" class="task-btn rounded-md px-4 py-2" @click="flight.abort()">{{ t('summary.end') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFlightStore } from '../stores/flight';
import { remarkText } from '../utils/debrief';
import { criticalLabel, useI18n, type MessageKey } from '../i18n';
import { phaseLabel } from '../stores/taxonomy';

const { t, lang } = useI18n();
const flight = useFlightStore();
const summary = computed(() => flight.summary);
const levelLabel = computed(() => (flight.level ? t(`level.${flight.level}` as MessageKey) : ''));
</script>
