<template>
  <div class="w-full">
    <svg viewBox="0 0 600 400" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <!-- Fond -->
      <rect width="600" height="400" rx="8" style="fill: var(--group-bg)"/>

      <!-- Piste -->
      <line x1="150" y1="200" x2="450" y2="200" stroke-width="6" stroke-linecap="round" style="stroke: var(--task-muted)"/>
      <text x="380" y="185" text-anchor="middle" font-size="1em" style="fill: var(--task-muted)">{{ runwayLabel }}</text>

      <!-- Seuils de piste -->
      <line x1="155" y1="195" x2="155" y2="205" stroke="#fff" stroke-width="2"/>
      <line x1="160" y1="195" x2="160" y2="205" stroke="#fff" stroke-width="2"/>
      <line x1="445" y1="195" x2="445" y2="205" stroke="#fff" stroke-width="2"/>
      <line x1="440" y1="195" x2="440" y2="205" stroke="#fff" stroke-width="2"/>

      <!-- Taxiway parking -->
      <line x1="200" y1="200" x2="200" y2="320" stroke-width="3" stroke-dasharray="6,4" style="stroke: var(--task-muted)"/>
      <rect x="160" y="320" width="80" height="30" fill="none" stroke-width="1.5" rx="3" style="stroke: var(--task-muted)"/>
      <text x="200" y="340" text-anchor="middle" font-size="1em" style="fill: var(--task-muted)">PARKING</text>

      <!-- Circuit de piste (sens main gauche) -->
      <!-- Montée initiale -->
      <line x1="450" y1="200" x2="530" y2="200" style="stroke: var(--accent-line)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/>
      <!-- Vent traversier montée -->
      <line x1="530" y1="200" x2="530" y2="80" style="stroke: var(--accent-line)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/>
      <!-- Vent arrière -->
      <line x1="530" y1="80" x2="100" y2="80" style="stroke: var(--accent-line)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/>
      <!-- Base -->
      <line x1="100" y1="80" x2="100" y2="200" style="stroke: var(--accent-line)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/>
      <!-- Finale -->
      <line x1="100" y1="200" x2="150" y2="200" style="stroke: var(--accent-line)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/>

      <!-- Flèches de direction sur le circuit -->
      <polygon points="490,197 490,203 500,200" style="fill: var(--accent-line)" opacity="0.6"/>
      <polygon points="527,130 533,130 530,120" style="fill: var(--accent-line)" opacity="0.6"/>
      <polygon points="300,77 300,83 290,80" style="fill: var(--accent-line)" opacity="0.6"/>
      <polygon points="97,150 103,150 100,160" style="fill: var(--accent-line)" opacity="0.6"/>
      <polygon points="120,197 120,203 130,200" style="fill: var(--accent-line)" opacity="0.6"/>

      <!-- Sortie de zone -->
      <line x1="530" y1="80" x2="580" y2="40" style="stroke: var(--accent-line)" stroke-width="1" stroke-dasharray="3,3" opacity="0.3"/>

      <!-- Points interactifs -->
      <g v-for="point in points" :key="point.id" class="cursor-pointer" @click="$emit('select-task', point.id, point.tab)">
        <!-- Anneau clignotant sur le 1er point tant que rien n'est sélectionné -->
        <circle v-if="!hasSelection && point.num === 1" :cx="point.x" :cy="point.y" r="14" fill="none" stroke-width="2" style="stroke: var(--accent-line)">
          <animate attributeName="r" values="14;24;14" dur="1.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite"/>
        </circle>
        <!-- En cours : anneau ; vu : plein atténué ; à faire : cerclé -->
        <circle v-if="isCurrent(point.id)" :cx="point.x" :cy="point.y" r="18" fill="none" stroke-width="2" style="stroke: var(--accent-line)"/>
        <circle
          :cx="point.x" :cy="point.y" r="14" stroke-width="2"
          class="transition hover:opacity-80"
          :style="pointStyle(point.id)"
        />
        <text :x="point.x" :y="point.y + 5" text-anchor="middle" font-size="1em" font-weight="bold"
          :style="{ fill: isVisited(point.id) ? '#fff' : 'var(--accent-line)' }">{{ point.num }}</text>
        <text :x="point.lx" :y="point.ly" :text-anchor="point.anchor || 'middle'" font-size="1em" style="fill: var(--task-text)">{{ point.label }}</text>
      </g>

      <!-- Légende -->
      <text x="450" y="390" font-size="1em" style="fill: var(--task-muted)">Circuit main gauche</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { useSimulatorStore } from '../stores/simulator';

const props = defineProps<{
  selectedTaskIds: string[]
}>();

defineEmits(['select-task']);

const formStore = useFormStore();
const langStore = useLangStore();
const simulatorStore = useSimulatorStore();

const runwayLabel = computed(() => {
  const lang = langStore.current as 'fr' | 'en';
  const rwy = formStore.formatRunway(formStore.form.RWY, lang);
  return `${lang === 'fr' ? 'PISTE' : 'RUNWAY'} ${rwy}`.trim();
});

const isVisited = (taskId: string) => props.selectedTaskIds.includes(taskId);
const isCurrent = (taskId: string) => simulatorStore.currentTaskId === taskId;
const hasSelection = computed(() => props.selectedTaskIds.length > 0);

const pointStyle = (taskId: string) => {
  if (isCurrent(taskId)) return { fill: 'var(--accent)', stroke: 'var(--accent)' };
  if (isVisited(taskId)) return { fill: 'var(--accent)', stroke: 'var(--accent)', opacity: 0.55 };
  return { fill: 'var(--task-bg)', stroke: 'var(--accent-line)' };
};

const points = [
  { id: 'MISE_EN_ROUTE',    tab: 'SO', num: 1, x: 200, y: 305, lx: 130, ly: 308, label: 'Mise en route' },
  { id: 'PRET_DEPART',      tab: 'SO', num: 2, x: 200, y: 230, lx: 130, ly: 245, label: 'Prêt au départ' },
  { id: 'PRET_DEPART1',     tab: 'DE', num: 3, x: 200, y: 200, lx: 200, ly: 185, label: 'Décollage' },
  { id: 'SORTIE_ZONE',      tab: 'CR', num: 4, x: 575, y: 32,  lx: 455, ly: 35,  label: 'Sortie de zone', anchor: 'start' },
  { id: 'VENT_ARRIERE',     tab: 'CR', num: 5, x: 350, y: 80,  lx: 350, ly: 60,  label: 'Vent arrière' },
  { id: 'FIN_VENT_ARRIERE', tab: 'AP', num: 6, x: 100, y: 80,  lx: 100, ly: 60,  label: 'Fin vent arr.' },
  { id: 'ATTERRISSAGE',     tab: 'AP', num: 7, x: 100, y: 200, lx: 70,  ly: 185, label: 'Finale' },
  { id: 'DEGAGEMENT',       tab: 'AT', num: 8, x: 300, y: 200, lx: 300, ly: 235, label: 'Dégagement' },
  { id: 'QUITTER',          tab: 'AT', num: 9, x: 230, y: 290, lx: 250, ly: 293, label: 'Quitter', anchor: 'start' }
];

</script>
