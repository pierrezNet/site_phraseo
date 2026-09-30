import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { buildFlight, FLIGHT_PHASES, scenarioName, type FlightStep, type Scenario } from '../utils/flight'
import { useFormStore } from './form'
import type { CriticalResult } from '../utils/quizScoring'
import { REMARKS, type RemarkCode } from '../utils/debrief'
import scenariosData from '../data/scenarios.json'
import phraseoVFR from '../data/phraseologieVFR.json'
import phraseoIFR from '../data/phraseologieIFR.json'

/** Nombre d'essais par réplique pilote avant d'afficher la réponse et de continuer */
export const MAX_ATTEMPTS = 2

export interface LineOutcome {
  attempts: number
  passed: boolean
  /** Réplique terminée : validée, ou essais épuisés */
  done: boolean
  score: number
  criticals: CriticalResult[]
  /** Erreurs de phraséologie relevées sur l'un des essais (débriefing) */
  remarks: RemarkCode[]
}

export const SCENARIOS = scenariosData as Scenario[]

/**
 * Regroupe des occurrences par clé : nombre d'occurrences et étapes concernées (sans doublon),
 * les plus fréquentes d'abord.
 */
function groupByStep<T>(occurrences: { key: string; step?: FlightStep; item: T }[]) {
  const groups = new Map<string, T & { count: number; steps: string[] }>()
  for (const { key, step, item } of occurrences) {
    const group = groups.get(key) ?? { ...item, count: 0, steps: [] }
    group.count++
    const title = step?.title ?? ''
    if (!group.steps.includes(title)) group.steps.push(title)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => b.count - a.count)
}

/**
 * Vol complet : enchaîne les étapes d'un scénario en mode quiz.
 * Les résultats sont indexés par étape puis par position de la réplique pilote dans l'étape.
 */
export const useFlightStore = defineStore('flight', () => {
  const scenario = ref<Scenario | null>(null)
  const level = ref('')
  const steps = ref<FlightStep[]>([])
  const index = ref(0)
  const finished = ref(false)
  // Résultats par étape, puis par clé de réplique (« 3 », ou « 3.reply » pour une relance ATC)
  const outcomes = ref<Record<number, Record<string, LineOutcome>>>({})

  const active = computed(() => scenario.value !== null)
  /** Nom du vol en cours, avec les paramètres (départ, arrivée) */
  const title = computed(() => (scenario.value ? scenarioName(scenario.value.name, useFormStore().form) : ''))
  const currentStep = computed(() => steps.value[index.value] ?? null)
  const isLastStep = computed(() => index.value >= steps.value.length - 1)

  function start(sc: Scenario, userLevel: string) {
    const data = sc.mode === 'VFR' ? phraseoVFR : phraseoIFR
    scenario.value = sc
    level.value = userLevel
    const formStore = useFormStore()
    steps.value = buildFlight(sc, data, userLevel, Math.random, formStore.isFrequencyOpen)
    index.value = 0
    finished.value = false
    outcomes.value = {}
  }

  function restart() {
    if (scenario.value) start(scenario.value, level.value)
  }

  function abort() {
    scenario.value = null
    steps.value = []
    finished.value = false
    outcomes.value = {}
  }

  function next() {
    if (isLastStep.value) finished.value = true
    else index.value++
  }

  /** Aller directement à une étape (tests en local) : ses résultats sont effacés pour la rejouer */
  function goTo(i: number) {
    if (i < 0 || i >= steps.value.length) return
    delete outcomes.value[i]
    index.value = i
    finished.value = false
  }

  /**
   * Enregistre un essai sur une réplique de l'étape courante ; renvoie l'état de la réplique.
   * `final` clôt la réplique même ratée (ex. l'ATC relance le pilote sur son intention).
   */
  function recordAttempt(
    line: string,
    result: { passed: boolean; score: number; criticals: CriticalResult[]; final?: boolean; remarks?: RemarkCode[] }
  ): LineOutcome {
    const step = (outcomes.value[index.value] ??= {})
    const attempts = (step[line]?.attempts ?? 0) + 1
    const outcome: LineOutcome = {
      attempts,
      passed: result.passed,
      done: result.passed || !!result.final || attempts >= MAX_ATTEMPTS,
      score: result.score,
      criticals: result.criticals,
      // Une erreur commise puis corrigée au second essai reste à débriefer
      remarks: [...new Set([...(step[line]?.remarks ?? []), ...(result.remarks ?? [])])],
    }
    step[line] = outcome
    return outcome
  }

  const outcomeOf = (line: string): LineOutcome | undefined => outcomes.value[index.value]?.[line]

  /** Résultats finaux (répliques terminées) de tout le vol */
  const allOutcomes = computed(() =>
    Object.entries(outcomes.value).flatMap(([stepIdx, lines]) =>
      Object.values(lines)
        .filter((o) => o.done)
        .map((o) => ({ step: steps.value[Number(stepIdx)], outcome: o }))
    )
  )

  /** Bilan : réussite par phase, score moyen, éléments critiques ratés */
  const summary = computed(() => {
    const results = allOutcomes.value
    const byPhase = FLIGHT_PHASES.map((tab) => {
      const inPhase = results.filter((r) => r.step?.tab === tab)
      return { tab, total: inPhase.length, passed: inPhase.filter((r) => r.outcome.passed).length }
    }).filter((p) => p.total > 0)
    // Éléments critiques ratés : « Niveau 110 — 3 fois (Mise en route, Descente) »
    const missed = groupByStep(
      results.flatMap((r) =>
        r.outcome.passed ? [] : r.outcome.criticals.filter((c) => !c.ok).map((c) => ({
          key: `${c.label}|${c.value}`, step: r.step, item: { label: c.label, value: c.value },
        }))
      )
    )

    // Débriefing : erreurs de phraséologie, regroupées par type avec les étapes concernées
    const remarks = groupByStep(
      results.flatMap((r) => r.outcome.remarks.map((code) => ({ key: code, step: r.step, item: { code, ...REMARKS[code] } })))
    )

    return {
      total: results.length,
      passed: results.filter((r) => r.outcome.passed).length,
      score: results.length ? Math.round(results.reduce((s, r) => s + r.outcome.score, 0) / results.length) : 0,
      byPhase,
      missed,
      remarks,
    }
  })

  /** Une étape déjà jouée contient-elle une réplique ratée ? (frise) */
  const stepMissed = (i: number): boolean => Object.values(outcomes.value[i] ?? {}).some((o) => o.done && !o.passed)

  /** Progression par phase pour la frise (étapes faites / total) */
  const phaseProgress = computed(() =>
    FLIGHT_PHASES.map((tab) => {
      const idx = steps.value.map((s, i) => ({ s, i })).filter(({ s }) => s.tab === tab)
      const done = idx.filter(({ i }) => finished.value || i < index.value).length
      return { tab, total: idx.length, done, current: !finished.value && currentStep.value?.tab === tab }
    }).filter((p) => p.total > 0)
  )

  return {
    scenario, title, level, steps, index, finished, active, currentStep, isLastStep,
    start, restart, abort, next, goTo, recordAttempt, outcomeOf, stepMissed, summary, phaseProgress,
  }
})
