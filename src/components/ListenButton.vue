<template>
  <button
    v-if="enabled"
    type="button"
    :class="['listen-btn', isPilot ? 'listen-btn--pilot' : 'listen-btn--atc', { 'is-loading': loading, 'is-playing': playing }]"
    :title="label"
    :aria-label="label"
    @click="toggle"
  >
    <PilotIcon v-if="isPilot" class="w-5 h-5" />
    <AtcIcon v-else class="w-5 h-5" />
  </button>
  <span v-else class="inline-block align-middle p-0.5">
    <PilotIcon v-if="isPilot" class="w-5 h-5" />
    <AtcIcon v-else class="w-5 h-5" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVoiceStore } from '../stores/voice';
import { useLangStore } from '../stores/lang';
import PilotIcon from './icons/PilotIcon.vue';
import AtcIcon from './icons/AtcIcon.vue';

/**
 * Icône d'une réplique (avion = pilote, micro = ATC), qui sert aussi de bouton d'écoute.
 * Sans relais ou si `listenable` est faux (pilote en quiz avant correction) : simple icône.
 */
// Prop booléenne absente = false en Vue : on fixe le défaut à true explicitement
const props = withDefaults(
  defineProps<{
    lineKey: string
    /** Texte préparé pour la synthèse (src/utils/speech.ts) */
    speech: string
    isPilot: boolean
    listenable?: boolean
  }>(),
  { listenable: true }
);

const voice = useVoiceStore();
const langStore = useLangStore();

const enabled = computed(() => voice.available && props.listenable && !!props.speech);
const loading = computed(() => voice.loading === props.lineKey);
const playing = computed(() => voice.playing === props.lineKey);
const label = computed(() =>
  loading.value || playing.value ? 'Arrêter' : props.isPilot ? 'Écouter le pilote' : "Écouter l'ATC"
);

const toggle = () => {
  if (loading.value || playing.value) voice.stop();
  else voice.play({ key: props.lineKey, text: props.speech, pilot: props.isPilot }, langStore.current as 'fr' | 'en');
};
</script>

<style scoped>
.listen-btn {
  --ring: var(--color-orange-500);
  position: relative;
  display: inline-flex;
  vertical-align: middle;
  padding: 2px;
  border-radius: 9999px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.listen-btn--pilot {
  --ring: var(--color-blue-500);
}
.listen-btn:hover,
.listen-btn:focus-visible {
  outline: none;
  transform: scale(1.15);
  box-shadow: 0 0 0 2px var(--ring);
  background-color: color-mix(in srgb, var(--ring) 12%, transparent);
}
.listen-btn:active {
  transform: scale(0.95);
}

/* Chargement : anneau en pointillés qui tourne */
.listen-btn.is-loading::after {
  content: '';
  position: absolute;
  inset: -3px;
  border: 2px dashed var(--ring);
  border-radius: 9999px;
  animation: listen-spin 1s linear infinite;
}

/* Lecture : ondes radio qui s'élargissent */
.listen-btn.is-playing {
  background-color: color-mix(in srgb, var(--ring) 15%, transparent);
  animation: listen-wave 1.2s ease-out infinite;
}

@keyframes listen-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes listen-wave {
  0% {
    box-shadow: 0 0 0 0 var(--ring);
  }
  100% {
    box-shadow: 0 0 0 10px transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .listen-btn,
  .listen-btn.is-playing,
  .listen-btn.is-loading::after {
    transition: none;
    animation: none;
  }
}
</style>
