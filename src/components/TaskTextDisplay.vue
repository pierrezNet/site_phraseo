<template>
  <div class="m-1 md:space-y-4 md:pr-6">
    <h2 class="hidden md:block custom-h2">Dialogues</h2>

    <!-- Fil d'Ariane : étape (et option) en cours -->
    <p v-if="context?.step" class="text-sm font-medium mb-2">
      <span class="opacity-60">Étape : </span>{{ context.step }}<span v-if="context.option" class="opacity-60"> › </span>{{ context.option }}
    </p>

    <!-- Rappel du mode quiz (seulement quand une étape/option est sélectionnée) -->
    <div v-if="quizStore.enabled && renderedLines.length > 0" class="text-sm mb-3 px-3 py-2 rounded bg-blue-50 border border-blue-200 text-blue-900">
      🎯 Mode quiz : reproduisez la phrase du pilote, puis vérifiez.
    </div>

    <template v-for="(line, index) in renderedLines" :key="index">
      <!-- Ligne pilote en mode quiz : saisie + correction -->
      <div
        v-if="line.isPilot && quizStore.enabled"
        class="w-full p-4 rounded-md mb-4 shadow border-l-4 bg-blue-100 border-blue-500"
      >
        <PilotIcon class="inline-block w-5 h-5 mr-2 align-middle" />
        <span class="text-sm font-medium">À vous — que dit le pilote ?</span>

        <template v-if="!results[index]">
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
              :class="results[index]!.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'"
            >
              {{ results[index]!.passed ? '✓ Validé' : '✗ À revoir' }}
            </span>
            <span class="text-sm font-medium">Score : {{ results[index]!.score }} %</span>
          </div>

          <ul v-if="results[index]!.criticals.length" class="text-sm space-y-0.5">
            <li v-for="c in results[index]!.criticals" :key="c.label">
              <span :class="c.ok ? 'text-green-700' : 'text-red-700'">
                {{ c.ok ? '✓' : '✗' }} {{ c.label }} : <strong>{{ c.value }}</strong>
              </span>
            </li>
          </ul>

          <div class="text-sm">
            <span class="opacity-70">Votre réponse :</span>
            <div class="italic">{{ answers[index] }}</div>
          </div>
          <div class="text-sm">
            <span class="opacity-70">Réponse attendue :</span>
            <div v-html="line.content"></div>
          </div>

          <div class="flex justify-end">
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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted, watch } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { useWeatherStore } from '../stores/weather';
import { useQuizStore } from '../stores/quiz';
import { replacePlaceholders } from '../utils/phraseoHelpers';
import { scoreAnswer, stripNotes, CRITICAL_TAGS, type Critical, type QuizResult } from '../utils/quizScoring';
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
    case 'QNH': {
      const d = weatherStore.metarData?.decoded || weatherStore.metarData;
      // altimeter.value peut être un nombre (METAR) → on force la chaîne
      return String(d?.altimeter?.value ?? formStore.form.QNH ?? '1013');
    }
    case 'ALT':
      return formStore.form.ALT || '';
    case 'NIV':
      return formStore.form.NIV || '';
    default:
      return '';
  }
};

/** Construit la liste des éléments critiques présents dans un texte source. */
const buildCriticals = (rawText: string, lang: 'fr' | 'en'): Critical[] => {
  return Object.keys(CRITICAL_TAGS)
    .filter(tag => rawText.includes(`[${tag}]`))
    .map(tag => ({ label: CRITICAL_TAGS[tag], value: String(resolveCriticalValue(tag, lang) ?? '') }))
    .filter(c => c.value.trim() !== '');
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
        expectedSpoken: stripNotes(processed),
        criticals: buildCriticals(item.__text, lang),
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
  results[index] = scoreAnswer(answer, line.expectedSpoken, line.criticals, callsignEquivalences());
};

const retry = (index: number) => {
  results[index] = null;
  answers[index] = '';
};

// Réinitialise le quiz quand la tâche, la langue ou le mode quiz changent
watch(() => props.selectedTaskTexts, resetQuiz);
watch(() => langStore.current, resetQuiz);
watch(() => quizStore.enabled, resetQuiz);
</script>
