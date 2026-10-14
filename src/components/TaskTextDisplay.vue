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
        :class="[
          'w-full p-4 rounded-md mb-4 shadow border-l-4 bg-blue-100 border-blue-500',
          { 'ring-2 ring-red-500': radio.recording === line.key }
        ]"
      >
        <!-- Icône avion : maintenir pour parler tant que la réponse est attendue ; écoute de la réponse attendue après correction -->
        <span
          class="select-none touch-none talk-btn"
          @pointerdown="!resultOf(line.key) && startTalk(line.key)"
          @pointerup="endTalk()"
          @pointerleave="endTalk()"
          @pointercancel="endTalk()"
        >
          <ListenButton
            :line-key="line.key"
            :speech="line.speech"
            is-pilot
            :listenable="!!resultOf(line.key) && isFinal(line.key) && !awaitingReply(line.key)"
            class="mr-2"
          />
        </span>
        <span class="text-sm font-medium">À vous — que dit le pilote ?</span>
        <span v-if="radio.recording === line.key && radio.live" class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">● ÉMISSION</span>
        <span v-else-if="radio.recording === line.key" class="ml-2 text-xs opacity-80">Ouverture du micro…</span>
        <span v-else-if="radio.transcribing === line.key" class="ml-2 text-xs opacity-80">Transcription…</span>

        <template v-if="!resultOf(line.key)">
          <!-- Mobile : réponse à la voix uniquement (pas de clavier), sauf si le micro ou le quota manque -->
          <textarea
            v-if="!voiceOnly"
            :ref="(el) => { textareas[line.key] = el as HTMLTextAreaElement | null }"
            v-model="answers[line.key]"
            @focus="lastFocused = line.key"
            @input="spokenAnswers[line.key] = false"
            rows="3"
            :placeholder="radio.available ? 'Maintenez Espace pour parler, ou tapez la phrase du pilote…' : 'Tapez la phrase du pilote…'"
            class="w-full mt-2 border rounded px-3 py-2 text-sm resize-y"
            @keydown.ctrl.enter="verify(line)"
          ></textarea>
          <div class="flex justify-end items-center gap-2 mt-2">
            <!-- Alternat : maintenir pour parler (souris, tactile) ; Espace au clavier -->
            <button
              v-if="radio.available"
              type="button"
              :class="[
                'rounded border select-none touch-none transition-colors talk-btn',
                voiceOnly ? 'w-full py-4 text-base font-medium' : 'mr-auto px-3 py-1.5 text-sm',
                radio.recording === line.key ? 'bg-red-600 text-white border-red-600' : 'border-blue-500 hover:bg-blue-500/10'
              ]"
              :disabled="!!radio.transcribing"
              @pointerdown.prevent="holdTalk($event, line.key)"
              @pointerup="endTalk()"
              @pointercancel="endTalk()"
              @contextmenu.prevent
            >
              {{ talkLabel(line.key) }}
            </button>
            <button
              v-if="!voiceOnly"
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
            <span class="opacity-70">{{ spokenAnswers[line.key] ? 'Entendu :' : 'Votre réponse :' }}</span>
            <div class="italic">{{ answers[line.key] }}</div>
          </div>
          <div v-if="isFinal(line.key) && !awaitingReply(line.key)" class="text-sm">
            <span class="opacity-70">Réponse attendue :</span>
            <div v-html="line.content"></div>
          </div>

          <!-- Réessayer seulement après un échec (une réponse validée est terminée) -->
          <div v-if="!resultOf(line.key)!.passed && (!isFinal(line.key) || !flight.active) && !relaunched[line.key]" class="flex justify-end">
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
        <ListenButton :line-key="line.key" :speech="line.speech" :is-pilot="line.isPilot" class="mr-2" />
        <span v-html="line.content"></span>
      </div>
    </template>

    <p v-if="voice.error" class="ko-text text-sm mb-2">{{ voice.error }}</p>
    <p v-if="radio.error" class="ko-text text-sm mb-2">{{ radio.error }}</p>

    <!-- Vol complet : passage à l'étape suivante une fois toutes les répliques pilote terminées -->
    <div v-if="flight.active && stepComplete" class="flex justify-end">
      <button type="button" class="task-btn task-btn--active rounded-md px-4 py-2" @click="flight.next()">
        {{ flight.isLastStep ? 'Terminer le vol ✓' : 'Étape suivante →' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { useWeatherStore } from '../stores/weather';
import { useQuizStore } from '../stores/quiz';
import { useFlightStore, MAX_ATTEMPTS } from '../stores/flight';
import { useVoiceStore } from '../stores/voice';
import { useRadioStore } from '../stores/radio';
import { vocabulary } from '../utils/sttVocabulary';
import { requirementsMet } from '../utils/flight';
import { replacePlaceholders } from '../utils/phraseoHelpers';
import { groupFlightNumber, toSpeech } from '../utils/speech';
import { buildCriticals, callsignEquivalences as callsignEquivalencesOf } from '../utils/criticals';
import { detectRemarks, isRogerInsteadOfReadback, REMARKS, type RemarkCode } from '../utils/debrief';
import { scoreAnswer, requiredText, CRITICAL_TAGS, type Critical, type QuizResult } from '../utils/quizScoring';
import ListenButton from './ListenButton.vue';

const props = defineProps<{
  selectedTaskTexts: any[]
  context?: { step: string; option: string }
}>();

const formStore = useFormStore();
const langStore = useLangStore();
const weatherStore = useWeatherStore();
const quizStore = useQuizStore();
const flight = useFlightStore();
const voice = useVoiceStore();
const radio = useRadioStore();

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
  /** Stations nécessaires : la réplique disparaît si l'une est fermée */
  _requires?: string[];
}

interface RenderedLine {
  /** Clé stable : « 3 », ou « 3.ask » / « 3.reply » pour une relance de l'ATC */
  key: string;
  /** Texte source avec ses tags (débriefing : indicatif complet ou abrégé attendu) */
  source: string;
  isPilot: boolean;
  content: string;
  expectedSpoken: string;
  /** Texte prêt pour la synthèse vocale (voix de l'ATC) */
  speech: string;
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
  // Voix française : numéro de vol par groupes de deux chiffres (« Air Europe zéro douze »)
  const speechOverrides = lang === 'fr'
    ? {
        ...flight.tagOverrides,
        CAL: groupFlightNumber(formStore.form.CAL ?? ''),
        CAA: groupFlightNumber(formStore.form.CAA || 'Station'),
      }
    : flight.tagOverrides;
  const render = (key: string, cls: string, text: string, intents: string[] = [], ask?: string): RenderedLine => {
    const processed = replacePlaceholders(text, lang, formStore, weatherStore, flight.tagOverrides);
    return {
      key,
      source: text,
      isPilot: cls === 'Pilot',
      content: tooltipHtml(processed),
      expectedSpoken: requiredText(processed),
      speech: toSpeech(replacePlaceholders(text, lang, formStore, weatherStore, speechOverrides), lang),
      // Un tag entre parenthèses est optionnel : il n'est pas exigé
      criticals: buildCriticals(requiredText(text), lang, formStore, weatherStore),
      intents,
      ask,
    };
  };

  return (props.selectedTaskTexts as SourceLine[])
    // Répliques liées à une station fermée masquées (ex. transfert Prévol → Sol sans Prévol)
    .filter(t => t._lang === lang && requirementsMet(t, formStore.isFrequencyOpen))
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
  voice.stop();
  spokenKeys.clear();
  for (const k of Object.keys(spokenAnswers)) delete spokenAnswers[k];
  for (const k of Object.keys(answers)) delete answers[k];
  for (const k of Object.keys(results)) delete results[k];
  for (const k of Object.keys(relaunched)) delete relaunched[k];
  for (const k of Object.keys(lineRemarks)) delete lineRemarks[k];
};

// Le callsign complet (CAL) et sa forme abrégée (CAA) sont interchangeables
const callsignEquivalences = () => callsignEquivalencesOf(formStore);

/** Étape à évaluation souple (ex. message de fin) : seul l'indicatif compte, formulation libre */
const lenientStep = computed(() => flight.active && !!flight.currentStep?.lenient);

type Grade = { result: QuizResult; relaunch: boolean };

/** Évaluation souple : seul l'indicatif compte (mais « Roger » seul reste faux) */
const gradeLenient = (line: RenderedLine, answer: string): Grade => {
  const callsign = line.criticals.filter((c) => c.label === CRITICAL_TAGS.CAL);
  const scored = scoreAnswer(answer, line.expectedSpoken, callsign, callsignEquivalences());
  return { result: { ...scored, passed: scored.criticals.every((c) => c.ok) && !rogerOnly(line, answer) }, relaunch: false };
};

/** Évaluation normale ; si seule l'intention manque (le reste serait validé), l'ATC relance au lieu de refuser */
const gradeStrict = (line: RenderedLine, answer: string): Grade => {
  const intentCriticals = line.intents.map((value) => ({ label: INTENT_LABEL, value }));
  const scored = scoreAnswer(answer, line.expectedSpoken, [...line.criticals, ...intentCriticals], callsignEquivalences());
  const result = rogerOnly(line, answer) ? { ...scored, passed: false } : scored;
  const intentMissing = result.criticals.some((c) => c.label === INTENT_LABEL && !c.ok);
  const relaunch =
    intentMissing &&
    !line.key.endsWith('.reply') &&
    scoreAnswer(answer, line.expectedSpoken, line.criticals, callsignEquivalences()).passed;
  return { result, relaunch };
};

const verify = (line: RenderedLine) => {
  const answer = answers[line.key];
  if (!answer || !answer.trim()) return;

  const { result, relaunch } = lenientStep.value ? gradeLenient(line, answer) : gradeStrict(line, answer);
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

// ── Voix de l'ATC ────────────────────────────────────────────────────────────

const speak = (line: RenderedLine) => voice.play({ key: line.key, text: line.speech }, langStore.current as 'fr' | 'en');

/** Répliques ATC déjà lues automatiquement pour la tâche en cours */
const spokenKeys = new Set<string>();

// En vol complet, l'ATC parle dès que ses répliques apparaissent (réponse, relance…).
// Déclaré après les watchers de réinitialisation : un changement de tâche remet d'abord à zéro.
watch(
  () => (flight.active && voice.enabled && !voice.quotaBlocked() ? displayedLines.value.filter((l) => !l.isPilot) : []),
  (atcLines) => {
    const fresh = atcLines.filter((l) => !spokenKeys.has(l.key));
    if (!fresh.length) return;
    fresh.forEach((l) => spokenKeys.add(l.key));
    voice.playAll(fresh.map((l) => ({ key: l.key, text: l.speech })), langStore.current as 'fr' | 'en');
  },
  { immediate: true }
);

// ── Alternat du pilote (quiz) ────────────────────────────────────────────────

/** Réponses données à la voix : affichées « Entendu : » */
const spokenAnswers = reactive<Record<string, boolean>>({});

const startTalk = (key: string) => {
  if (!radio.available || resultOf(key)) return;
  voice.stop();
  // Coupure automatique à 15 s : la transcription part comme au relâchement
  radio.talk(key, () => endTalk());
};

/**
 * Mobile ou tablette : pas de clavier pour répondre. Le signal « pointeur tactile » ne suffit pas
 * (certains navigateurs mobiles ne le donnent pas) : on retient aussi un navigateur qui s'annonce mobile,
 * et l'iPad, qui se présente comme un Mac tactile.
 */
const isTouch = (() => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    !!window.matchMedia?.('(pointer: coarse)').matches ||
    /Android|iPhone|iPad|iPod|Mobi/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
})();

/** Mobile : la réponse se donne à la voix, sauf micro refusé ou quota atteint (retour au clavier) */
const voiceOnly = computed(() => isTouch && radio.available && !radio.micDenied && !voice.quotaBlocked());

const talkLabel = (key: string): string => {
  if (radio.transcribing === key) return 'Transcription…';
  if (radio.recording === key) return radio.live ? '● Relâchez pour envoyer' : 'Ouverture du micro…';
  return isTouch ? '🎙 Maintenir pour parler' : '🎙 Maintenir pour parler (Espace)';
};

/** Bouton maintenu : le pointeur est capturé, un léger glissement du doigt ne coupe pas l'émission */
const holdTalk = (e: PointerEvent, key: string) => {
  (e.currentTarget as Element | null)?.setPointerCapture?.(e.pointerId);
  startTalk(key);
};

/** Fin d'émission : le texte entendu devient la réponse, aussitôt vérifiée */
const endTalk = async () => {
  const key = radio.recording;
  if (!key) return;
  const lang = langStore.current as 'fr' | 'en';
  const line = renderedLines.value.find((l) => l.key === key);
  // Vocabulaire sans nombres (noms propres de la réplique, stations, alphabet) pour guider Whisper
  const text = await radio.release(lang, line ? vocabulary(lang, [line.expectedSpoken]) : []);
  if (!text || !line || resultOf(key)) return;
  answers[key] = text;
  spokenAnswers[key] = true;
  verify(line);
};

// Clavier : Espace maintenu = parler (quiz) ; R = réécouter l'ATC.
// Dans une zone de saisie, les touches écrivent normalement, sauf Espace dans une réponse encore vide
// (une espace en début de réponse ne sert à rien) : on peut parler sans quitter le champ.
const outsideTyping = (e: KeyboardEvent) =>
  !(e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"], .modal');

/** Réplique dont la zone de réponse vide a le focus */
const emptyAnswerField = (e: KeyboardEvent): string | null => {
  const entry = Object.entries(textareas).find(([, el]) => el && el === e.target);
  return entry && !(answers[entry[0]] ?? '').trim() ? entry[0] : null;
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const field = e.code === 'Space' ? emptyAnswerField(e) : null;
  if (!field && !outsideTyping(e)) return;
  if (e.code === 'Space') {
    const key = quizActive.value && radio.available ? field ?? insertionTarget() : null;
    if (!key) return;
    // Pas de défilement, ni de clic sur un bouton qui aurait gardé le focus
    e.preventDefault();
    if (!e.repeat && !radio.recording) startTalk(key);
  } else if (e.code === 'KeyR' && !e.repeat && voice.available) {
    const atc = displayedLines.value.filter((l) => !l.isPilot).at(-1);
    if (!atc) return;
    e.preventDefault();
    if (voice.playing === atc.key || voice.loading === atc.key) voice.stop();
    else speak(atc);
  }
};

const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space' && radio.recording) {
    e.preventDefault();
    endTalk();
  }
};

// Fenêtre quittée pendant l'émission : on envoie ce qui a été dit
onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', endTalk);
});
// Quiz quitté : micro fermé (il reste ouvert une minute entre deux réponses pour ne pas couper le début du message)
watch(quizActive, (on) => !on && radio.dispose());

onBeforeUnmount(() => {
  radio.dispose();
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', endTalk);
  voice.stop();
});
</script>

<style scoped>
/* iOS : pas de loupe ni de menu de sélection pendant l'appui long sur le bouton d'alternat */
.talk-btn {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}
</style>
