<template>
  <div class="m-1 md:space-y-4 md:pr-6">
    <h2 class="hidden md:block custom-h2">Dialogues</h2>

    <!-- Fil d'Ariane : étape (et option) en cours -->
    <p v-if="context?.step" class="text-sm font-medium mb-2">
      <span class="opacity-60">Étape : </span>{{ context.step }}<span v-if="context.option" class="opacity-60"> › </span>{{ context.option }}
    </p>

    <!-- Rappel du mode quiz (seulement quand une étape/option est sélectionnée) -->
    <div v-if="quizActive && renderedLines.length > 0" class="notice text-sm mb-3 px-3 py-2 rounded">
      <template v-if="flight.active">✈ Vol complet : répondez comme le pilote. {{ MAX_ATTEMPTS }} essais par réplique.</template>
      <template v-else>🎯 Mode quiz : reproduisez la phrase du pilote, puis vérifiez.</template>
    </div>

    <template v-for="(line, index) in displayedLines" :key="index">
      <!-- Ligne pilote en mode quiz : saisie + correction -->
      <div
        v-if="line.isPilot && quizActive"
        class="w-full p-4 rounded-md mb-4 shadow border-l-4 bg-blue-100 border-blue-500"
      >
        <PilotIcon class="inline-block w-5 h-5 mr-2 align-middle" />
        <span class="text-sm font-medium">À vous — que dit le pilote ?</span>

        <template v-if="!resultOf(index)">
          <textarea
            v-model="answers[index]"
            rows="3"
            placeholder="Tapez la phrase du pilote…"
            class="w-full mt-2 border rounded px-3 py-2 text-sm resize-y"
            @keydown.ctrl.enter="verify(index, line)"
          ></textarea>
          <div class="flex justify-end mt-2">
            <button
              @click="verify(index, line)"
              :disabled="!(answers[index] && answers[index].trim())"
              class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vérifier
            </button>
          </div>
        </template>

        <!-- Résultat -->
        <div v-else class="mt-3 space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-0.5 rounded text-sm font-semibold"
              :class="resultOf(index)!.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'"
            >
              {{ verdictLabel(index) }}
            </span>
            <span class="text-sm font-medium">Score : {{ resultOf(index)!.score }} %</span>
          </div>

          <!-- En vol, avant le dernier essai, on ne dévoile ni les valeurs manquées ni la réponse -->
          <ul v-if="resultOf(index)!.criticals.length" class="text-sm space-y-0.5">
            <li v-for="c in resultOf(index)!.criticals" :key="c.label">
              <span :class="c.ok ? 'ok-text' : 'ko-text'">
                {{ c.ok ? '✓' : '✗' }} {{ c.label }}<template v-if="c.ok || isFinal(index)"> : <strong>{{ c.value }}</strong></template>
              </span>
            </li>
          </ul>

          <div v-if="answers[index]" class="text-sm">
            <span class="opacity-70">Votre réponse :</span>
            <div class="italic">{{ answers[index] }}</div>
          </div>
          <div v-if="isFinal(index)" class="text-sm">
            <span class="opacity-70">Réponse attendue :</span>
            <div v-html="line.content"></div>
          </div>

          <div v-if="!isFinal(index) || !flight.active" class="flex justify-end">
            <button
              @click="retry(index)"
              class="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>

      <!-- Affichage normal (ATC, ou pilote hors quiz) -->
      <div
        v-else
        :class="[
          'w-full p-4 rounded-md py-2 mb-4 shadow transition border-l-4',
          line.isPilot ? 'bg-blue-100 border-blue-500' : 'bg-orange-100 border-orange-500'
        ]"
      >
        <PilotIcon v-if="line.isPilot" class="inline-block w-5 h-5 mr-2 align-middle" />
        <AtcIcon v-else class="inline-block w-5 h-5 mr-2 align-middle" />
        <span v-html="line.content"></span>
      </div>
    </template>

    <!-- Vol complet : passage à l'étape suivante une fois toutes les répliques pilote terminées -->
    <div v-if="flight.active && stepComplete" class="flex justify-end">
      <button type="button" class="task-btn task-btn--active rounded-md px-4 py-2" @click="flight.next()">
        {{ flight.isLastStep ? 'Terminer le vol ✓' : 'Étape suivante →' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted, watch } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { useWeatherStore } from '../stores/weather';
import { useQuizStore } from '../stores/quiz';
import { useFlightStore, MAX_ATTEMPTS } from '../stores/flight';
import { replacePlaceholders, resolveStationParts } from '../utils/phraseoHelpers';
import { scoreAnswer, requiredText, CRITICAL_TAGS, type Critical, type QuizResult } from '../utils/quizScoring';
import PilotIcon from './icons/PilotIcon.vue';
import AtcIcon from './icons/AtcIcon.vue';

const props = defineProps<{
  selectedTaskTexts: any[]
  context?: { step: string; option: string }
}>();

const formStore = useFormStore();
const langStore = useLangStore();
const weatherStore = useWeatherStore();
const quizStore = useQuizStore();
const flight = useFlightStore();

// Le vol complet se joue toujours en mode quiz
const quizActive = computed(() => quizStore.enabled || flight.active);

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

/** Résout la valeur concrète d'un tag critique dans la langue courante. */
const resolveCriticalValue = (tag: string, lang: 'fr' | 'en'): string => {
  switch (tag) {
    case 'RWY':
      return formStore.formatRunway(formStore.form.RWY, lang);
    case 'QNH':
      return weatherStore.metarQnh ?? formStore.form.QNH ?? '1013';
    case 'DEL':
    case 'GND':
    case 'TWR':
    case 'APP':
    case 'CTR':
    {
      // Fréquence seule (même repli de station que le texte affiché) ; ignorée si saisie invalide
      const { frequency } = resolveStationParts(tag, lang, formStore);
      return /\d/.test(frequency) ? frequency : '';
    }
    default:
      // ALT, NIV, CAP, VIT, SQU, STA, WPT, HLD, VOI, INF : valeur brute du formulaire
      return formStore.form[tag] || '';
  }
};

/** Construit la liste des éléments critiques présents dans un texte source. */
const buildCriticals = (rawText: string, lang: 'fr' | 'en'): Critical[] => {
  return Object.keys(CRITICAL_TAGS)
    .filter(tag => rawText.includes(`[${tag}]`))
    .map(tag => ({ label: CRITICAL_TAGS[tag], value: String(resolveCriticalValue(tag, lang) ?? '') }))
    .filter(c => c.value.trim() !== '')
    // [CAL] et [CAA] dans la même réplique : un seul contrôle d'indicatif
    .filter((c, i, all) => all.findIndex(o => o.label === c.label) === i);
};

const tooltipHtml = (processed: string): string =>
  processed.replace(/\{([^}]+)\}/g, (_match, note: string) => {
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

const renderedLines = computed(() => {
  const lang = langStore.current as 'fr' | 'en';

  return props.selectedTaskTexts
    .filter(t => t._lang === lang)
    .map(item => {
      const processed = replacePlaceholders(item.__text, lang, formStore, weatherStore);
      return {
        isPilot: item._class === 'Pilot',
        content: tooltipHtml(processed),
        expectedSpoken: requiredText(processed),
        // Un tag entre parenthèses est optionnel : il n'est pas exigé
        criticals: buildCriticals(requiredText(item.__text), lang),
      };
    });
});

const hasPilotLine = computed(() => renderedLines.value.some(l => l.isPilot));

// État du quiz par index de ligne
const answers = reactive<Record<number, string>>({});
const results = reactive<Record<number, QuizResult | null>>({});

const resetQuiz = () => {
  for (const k of Object.keys(answers)) delete answers[Number(k)];
  for (const k of Object.keys(results)) delete results[Number(k)];
};

// Le callsign complet (CAL) et sa forme abrégée (CAA) sont interchangeables
const callsignEquivalences = (): string[][] => {
  const caa = formStore.form.CAA?.trim();
  const cal = formStore.form.CAL?.trim();
  return caa && cal && caa !== cal ? [[caa, cal]] : [];
};

const verify = (index: number, line: { expectedSpoken: string; criticals: Critical[] }) => {
  const answer = answers[index];
  if (!answer || !answer.trim()) return;
  const result = scoreAnswer(answer, line.expectedSpoken, line.criticals, callsignEquivalences());
  results[index] = result;
  if (flight.active) flight.recordAttempt(index, result);
};

const retry = (index: number) => {
  results[index] = null;
  // En vol, on garde la réponse pour la corriger ; hors vol, on repart de zéro
  if (!flight.active) answers[index] = '';
};

// ── Vol complet ──────────────────────────────────────────────────────────────

/** Réplique terminée : hors vol dès qu'elle est notée ; en vol, validée ou essais épuisés */
const isFinal = (index: number): boolean => !flight.active || !!flight.outcomeOf(index)?.done;

/** Résultat affiché : celui de la saisie, ou à défaut le résultat final enregistré pour le vol */
const resultOf = (index: number) => {
  if (results[index]) return results[index];
  const outcome = flight.active ? flight.outcomeOf(index) : undefined;
  return outcome?.done ? outcome : null;
};

const verdictLabel = (index: number): string => {
  const r = resultOf(index)!;
  if (r.passed) return '✓ Validé';
  if (!flight.active) return '✗ À revoir';
  return isFinal(index) ? '✗ Raté' : `✗ Essai ${flight.outcomeOf(index)?.attempts ?? 1}/${MAX_ATTEMPTS} — à revoir`;
};

/** En vol, les répliques se dévoilent au fil de l'échange : jusqu'à la première réplique pilote non terminée */
const displayedLines = computed(() => {
  if (!flight.active) return renderedLines.value;
  const pending = renderedLines.value.findIndex((l, i) => l.isPilot && !flight.outcomeOf(i)?.done);
  return pending === -1 ? renderedLines.value : renderedLines.value.slice(0, pending + 1);
});

const stepComplete = computed(() =>
  renderedLines.value.every((l, i) => !l.isPilot || !!flight.outcomeOf(i)?.done)
);

// Réinitialise le quiz quand la tâche, la langue ou le mode quiz changent
watch(() => props.selectedTaskTexts, resetQuiz);
watch(() => langStore.current, resetQuiz);
watch(() => quizStore.enabled, resetQuiz);
</script>
