import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { buildFlight, FLIGHT_PHASES, type FlightStep, type Scenario } from '../utils/flight'
import type { CriticalResult } from '../utils/quizScoring'
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
}

export const SCENARIOS = scenariosData as Scenario[]

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
  const outcomes = ref<Record<number, Record<number, LineOutcome>>>({})

  const active = computed(() => scenario.value !== null)
  const currentStep = computed(() => steps.value[index.value] ?? null)
  const isLastStep = computed(() => index.value >= steps.value.length - 1)

  function start(sc: Scenario, userLevel: string) {
    const data = sc.mode === 'VFR' ? phraseoVFR : phraseoIFR
    scenario.value = sc
    level.value = userLevel
    steps.value = buildFlight(sc, data, userLevel)
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

  /** Enregistre un essai sur une réplique de l'étape courante ; renvoie l'état de la réplique. */
  function recordAttempt(line: number, result: { passed: boolean; score: number; criticals: CriticalResult[] }): LineOutcome {
    const step = (outcomes.value[index.value] ??= {})
    const attempts = (step[line]?.attempts ?? 0) + 1
    const outcome: LineOutcome = {
      attempts,
      passed: result.passed,
      done: result.passed || attempts >= MAX_ATTEMPTS,
      score: result.score,
      criticals: result.criticals,
    }
    step[line] = outcome
    return outcome
  }

  const outcomeOf = (line: number): LineOutcome | undefined => outcomes.value[index.value]?.[line]

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
    // Éléments critiques ratés, regroupés : « Niveau 110 — 3 fois (Mise en route, Descente) »
    const missedMap = new Map<string, { label: string; value: string; count: number; steps: string[] }>()
    for (const r of results) {
      if (r.outcome.passed) continue
      for (const c of r.outcome.criticals.filter((c) => !c.ok)) {
        const key = `${c.label}|${c.value}`
        const entry = missedMap.get(key) ?? { label: c.label, value: c.value, count: 0, steps: [] }
        entry.count++
        const title = r.step?.title ?? ''
        if (!entry.steps.includes(title)) entry.steps.push(title)
        missedMap.set(key, entry)
      }
    }
    const missed = [...missedMap.values()].sort((a, b) => b.count - a.count)
    return {
      total: results.length,
      passed: results.filter((r) => r.outcome.passed).length,
      score: results.length ? Math.round(results.reduce((s, r) => s + r.outcome.score, 0) / results.length) : 0,
      byPhase,
      missed,
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
    scenario, level, steps, index, finished, active, currentStep, isLastStep,
    start, restart, abort, next, goTo, recordAttempt, outcomeOf, stepMissed, summary, phaseProgress,
  }
})
