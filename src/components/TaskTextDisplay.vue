<template>
  <div class="m-1 md:space-y-4 md:pr-6">
    <h2 class="hidden md:block custom-h2">Dialogues</h2>

    <!-- Fil d'Ariane : étape (et option) en cours -->
    <p v-if="context?.step" class="text-sm font-medium mb-2">
      <span class="opacity-60">Étape : </span>{{ context.step }}<span v-if="context.option" class="opacity-60"> › </span>{{ context.option }}
    </p>

    <!-- Vol complet : consigne d'instructeur (la décision du pilote, pas la phrase à dire) -->
    <div v-if="flight.active && flight.currentStep?.brief" class="strip strip--highlight text-sm mb-3 px-3 py-2 rounded border">
      📋 <strong>Consigne :</strong> {{ flight.currentStep.brief }}
    </div>

    <!-- Rappel du mode quiz (seulement quand une étape/option est sélectionnée) -->
    <div v-if="quizActive && renderedLines.length > 0" class="notice text-sm mb-3 px-3 py-2 rounded">
      <template v-if="flight.active">✈ Vol complet : répondez comme le pilote. {{ MAX_ATTEMPTS }} essais par réplique.</template>
      <template v-else>🎯 Mode quiz : reproduisez la phrase du pilote, puis vérifiez.</template>
    </div>

    <template v-for="line in displayedLines" :key="line.key">
      <!-- Ligne pilote en mode quiz : saisie + correction -->
      <div
        v-if="line.isPilot && quizActive"
        class="w-full p-4 rounded-md mb-4 shadow border-l-4 bg-blue-100 border-blue-500"
      >
        <PilotIcon class="inline-block w-5 h-5 mr-2 align-middle" />
        <span class="text-sm font-medium">À vous — que dit le pilote ?</span>

        <template v-if="!resultOf(line.key)">
          <textarea
            :ref="(el) => { textareas[line.key] = el as HTMLTextAreaElement | null }"
            v-model="answers[line.key]"
            @focus="lastFocused = line.key"
            rows="3"
            placeholder="Tapez la phrase du pilote…"
            class="w-full mt-2 border rounded px-3 py-2 text-sm resize-y"
            @keydown.ctrl.enter="verify(line)"
          ></textarea>
          <div class="flex justify-end mt-2">
            <button
              @click="verify(line)"
              :disabled="!(answers[line.key] && answers[line.key].trim())"
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
              :class="resultOf(line.key)!.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'"
            >
              {{ verdictLabel(line.key) }}
            </span>
            <span class="text-sm font-medium">Score : {{ resultOf(line.key)!.score }} %</span>
          </div>

          <!-- En vol, avant le dernier essai, on ne dévoile ni les valeurs manquées ni la réponse -->
          <ul v-if="resultOf(line.key)!.criticals.length" class="text-sm space-y-0.5">
            <li v-for="c in resultOf(line.key)!.criticals" :key="c.label">
              <span :class="c.ok ? 'ok-text' : 'ko-text'">
                {{ c.ok ? '✓' : '✗' }} {{ c.label }}<template v-if="c.ok || (isFinal(line.key) && !awaitingReply(line.key))"> : <strong>{{ c.value }}</strong></template>
              </span>
            </li>
          </ul>

          <!-- Débriefing : erreurs de phraséologie repérées dans la réponse -->
          <ul v-if="lineRemarks[line.key]?.length" class="text-sm space-y-0.5">
            <li v-for="code in lineRemarks[line.key]" :key="code" class="ko-text">💬 {{ REMARKS[code].title }}</li>
          </ul>

          <div v-if="answers[line.key]" class="text-sm">
            <span class="opacity-70">Votre réponse :</span>
            <div class="italic">{{ answers[line.key] }}</div>
          </div>
          <div v-if="isFinal(line.key) && !awaitingReply(line.key)" class="text-sm">
            <span class="opacity-70">Réponse attendue :</span>
            <div v-html="line.content"></div>
          </div>

          <div v-if="(!isFinal(line.key) || !flight.active) && !relaunched[line.key]" class="flex justify-end">
            <button
              @click="retry(line.key)"
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
import { computed, reactive, ref, onMounted, watch, nextTick } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { useWeatherStore } from '../stores/weather';
import { useQuizStore } from '../stores/quiz';
import { useFlightStore, MAX_ATTEMPTS } from '../stores/flight';
import { replacePlaceholders, resolveStationParts } from '../utils/phraseoHelpers';
import { detectRemarks, isRogerInsteadOfReadback, REMARKS, type RemarkCode } from '../utils/debrief';
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

interface SourceLine {
  _class: string;
  _lang: string;
  __text: string;
  /** Formulations obligatoires hors tags (ex. l'intention « pour un complet ») */
  _critical?: string[];
  /** Question de l'ATC si une formulation obligatoire manque (défaut : demande d'intentions) */
  _ask?: string;
}

interface RenderedLine {
  /** Clé stable : « 3 », ou « 3.ask » / « 3.reply » pour une relance de l'ATC */
  key: string;
  /** Texte source avec ses tags (débriefing : indicatif complet ou abrégé attendu) */
  source: string;
  isPilot: boolean;
  content: string;
  expectedSpoken: string;
  criticals: Critical[];
  /** Formulations obligatoires : leur absence déclenche une relance de l'ATC */
  intents: string[];
  ask?: string;
}

const INTENT_LABEL = 'Intention';
const DEFAULT_ASK = { fr: '[CAA], quelles sont vos intentions ?', en: '[CAA], say intentions.' };

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Répliques pour lesquelles l'ATC a relancé le pilote (intention non annoncée) */
const relaunched = reactive<Record<string, boolean>>({});

/** Erreurs de phraséologie relevées par réplique (tous essais confondus) */
const lineRemarks = reactive<Record<string, RemarkCode[]>>({});

const noteRemarks = (key: string, codes: RemarkCode[]): RemarkCode[] => {
  lineRemarks[key] = [...new Set([...(lineRemarks[key] ?? []), ...codes])];
  return codes;
};

const flightCallsign = () => ({ cal: formStore.form.CAL ?? '', caa: formStore.form.CAA ?? '' });

const remarksFor = (line: RenderedLine, answer: string): RemarkCode[] =>
  detectRemarks({ source: line.source, expected: line.expectedSpoken, answer, callsign: flightCallsign() });

/** « Roger » seul à la place d'un collationnement : toujours faux, quel que soit le score */
const rogerOnly = (line: RenderedLine, answer: string): boolean =>
  isRogerInsteadOfReadback({ expected: line.expectedSpoken, answer, callsign: flightCallsign() });

const renderedLines = computed<RenderedLine[]>(() => {
  const lang = langStore.current as 'fr' | 'en';
  const render = (key: string, cls: string, text: string, intents: string[] = [], ask?: string): RenderedLine => {
    const processed = replacePlaceholders(text, lang, formStore, weatherStore);
    return {
      key,
      source: text,
      isPilot: cls === 'Pilot',
      content: tooltipHtml(processed),
      expectedSpoken: requiredText(processed),
      // Un tag entre parenthèses est optionnel : il n'est pas exigé
      criticals: buildCriticals(requiredText(text), lang),
      intents,
      ask,
    };
  };

  return (props.selectedTaskTexts as SourceLine[])
    .filter(t => t._lang === lang)
    .flatMap((item, i) => {
      const key = String(i);
      const intents = item._class === 'Pilot' ? item._critical ?? [] : [];
      const line = render(key, item._class, item.__text, intents, item._ask);
      if (!relaunched[key]) return [line];
      // Relance : l'ATC demande l'intention, le pilote doit la préciser
      const reply = `${capitalize(intents.join(', '))}, [CAA].`;
      return [
        line,
        render(`${key}.ask`, 'ATC', item._ask ?? DEFAULT_ASK[lang]),
        render(`${key}.reply`, 'Pilot', reply, intents),
      ];
    });
});

// État du quiz par clé de réplique
const answers = reactive<Record<string, string>>({});
const results = reactive<Record<string, QuizResult | null>>({});

// ── Insertion depuis le bandeau de vol ───────────────────────────────────────
const textareas: Record<string, HTMLTextAreaElement | null> = {};
const lastFocused = ref<string | null>(null);

/** Zone de saisie visée : la dernière utilisée si elle attend encore une réponse, sinon la première ouverte */
const insertionTarget = (): string | null => {
  const open = (key: string) => !!textareas[key] && !resultOf(key);
  if (lastFocused.value !== null && open(lastFocused.value)) return lastFocused.value;
  return displayedLines.value.map((l) => l.key).find(open) ?? null;
};

watch(
  () => quizStore.insertion,
  async (insertion) => {
    const key = insertionTarget();
    if (!insertion || key === null) return;
    const el = textareas[key]!;
    const current = answers[key] ?? '';
    const start = document.activeElement === el ? el.selectionStart : current.length;
    const end = document.activeElement === el ? el.selectionEnd : current.length;
    const before = current.slice(0, start);
    const after = current.slice(end);
    // Espaces autour du texte inséré, sans doublon
    // (espace final aussi en fin de texte, pour enchaîner la saisie)
    const text = `${before && !/\s$/.test(before) ? ' ' : ''}${insertion.text}${/^[\s,.]/.test(after) ? '' : ' '}`;
    answers[key] = before + text + after;
    await nextTick();
    el.focus();
    el.setSelectionRange(before.length + text.length, before.length + text.length);
  }
);

const resetQuiz = () => {
  for (const k of Object.keys(answers)) delete answers[k];
  for (const k of Object.keys(results)) delete results[k];
  for (const k of Object.keys(relaunched)) delete relaunched[k];
  for (const k of Object.keys(lineRemarks)) delete lineRemarks[k];
};

// Le callsign complet (CAL) et sa forme abrégée (CAA) sont interchangeables
const callsignEquivalences = (): string[][] => {
  const caa = formStore.form.CAA?.trim();
  const cal = formStore.form.CAL?.trim();
  return caa && cal && caa !== cal ? [[caa, cal]] : [];
};

/** Étape à évaluation souple (ex. message de fin) : seul l'indicatif compte, formulation libre */
const lenientStep = computed(() => flight.active && !!flight.currentStep?.lenient);

const verify = (line: RenderedLine) => {
  const answer = answers[line.key];
  if (!answer || !answer.trim()) return;

  if (lenientStep.value) {
    const callsign = line.criticals.filter((c) => c.label === CRITICAL_TAGS.CAL);
    const scored = scoreAnswer(answer, line.expectedSpoken, callsign, callsignEquivalences());
    const result = { ...scored, passed: scored.criticals.every((c) => c.ok) && !rogerOnly(line, answer) };
    results[line.key] = result;
    flight.recordAttempt(line.key, { ...result, remarks: noteRemarks(line.key, remarksFor(line, answer)) });
    return;
  }

  const intentCriticals = line.intents.map((value) => ({ label: INTENT_LABEL, value }));
  const scored = scoreAnswer(answer, line.expectedSpoken, [...line.criticals, ...intentCriticals], callsignEquivalences());
  const result = rogerOnly(line, answer) ? { ...scored, passed: false } : scored;

  // Seule l'intention manque (le reste serait validé) : l'ATC relance au lieu de refuser
  const baseResult = scoreAnswer(answer, line.expectedSpoken, line.criticals, callsignEquivalences());
  const intentMissing = result.criticals.some((c) => c.label === INTENT_LABEL && !c.ok);
  const relaunch = intentMissing && baseResult.passed && !line.key.endsWith('.reply');

  results[line.key] = result;
  if (relaunch) relaunched[line.key] = true;
  const remarks = noteRemarks(line.key, [...remarksFor(line, answer), ...(relaunch ? ['INTENT_MISSING' as const] : [])]);
  if (flight.active) flight.recordAttempt(line.key, { ...result, final: relaunch, remarks });
};

const retry = (key: string) => {
  results[key] = null;
  // En vol, on garde la réponse pour la corriger ; hors vol, on repart de zéro
  if (!flight.active) answers[key] = '';
};

/** Relance en cours : la réponse attendue n'est montrée qu'une fois l'intention précisée */
const awaitingReply = (key: string): boolean => !!relaunched[key] && !isFinal(`${key}.reply`) && !resultOf(`${key}.reply`);

// ── Vol complet ──────────────────────────────────────────────────────────────

/** Réplique terminée : hors vol dès qu'elle est notée ; en vol, validée ou essais épuisés */
const isFinal = (key: string): boolean => !flight.active || !!flight.outcomeOf(key)?.done;

/** Résultat affiché : celui de la saisie, ou à défaut le résultat final enregistré pour le vol */
const resultOf = (key: string) => {
  if (results[key]) return results[key];
  const outcome = flight.active ? flight.outcomeOf(key) : undefined;
  return outcome?.done ? outcome : null;
};

const verdictLabel = (key: string): string => {
  const r = resultOf(key)!;
  if (r.passed) return lenientStep.value ? '✓ Validé (formulation libre)' : '✓ Validé';
  if (relaunched[key]) return '↪ Intention non annoncée';
  if (!flight.active) return '✗ À revoir';
  return isFinal(key) ? '✗ Échoué' : `✗ Essai ${flight.outcomeOf(key)?.attempts ?? 1}/${MAX_ATTEMPTS} — à revoir`;
};

/** En vol, les répliques se dévoilent au fil de l'échange : jusqu'à la première réplique pilote non terminée */
const displayedLines = computed(() => {
  if (!flight.active) return renderedLines.value;
  const pending = renderedLines.value.findIndex((l) => l.isPilot && !flight.outcomeOf(l.key)?.done);
  return pending === -1 ? renderedLines.value : renderedLines.value.slice(0, pending + 1);
});

const stepComplete = computed(() =>
  renderedLines.value.every((l) => !l.isPilot || !!flight.outcomeOf(l.key)?.done)
);

// Réinitialise le quiz quand la tâche, la langue ou le mode quiz changent
watch(() => props.selectedTaskTexts, resetQuiz);
watch(() => langStore.current, resetQuiz);
watch(() => quizStore.enabled, resetQuiz);
</script>
