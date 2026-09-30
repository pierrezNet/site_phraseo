import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFlightStore, SCENARIOS, MAX_ATTEMPTS } from './flight'

const ko = (label: string, value: string) => ({ passed: false, score: 20, criticals: [{ label, value, ok: false }] })
const ok = { passed: true, score: 100, criticals: [] }

describe('flightStore', () => {
  let flight: ReturnType<typeof useFlightStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    flight = useFlightStore()
    flight.start(SCENARIOS.find((s) => s.mode === 'IFR')!, 'débutant')
  })

  it('démarre sur la première étape', () => {
    expect(flight.active).toBe(true)
    expect(flight.index).toBe(0)
    expect(flight.steps.length).toBeGreaterThan(0)
  })

  it(`une réplique ratée reste ouverte jusqu'à ${MAX_ATTEMPTS} essais`, () => {
    expect(flight.recordAttempt('0', ko('Niveau', '110')).done).toBe(false)
    expect(flight.recordAttempt('0', ko('Niveau', '110')).done).toBe(true)
  })

  it('une réplique close par l\'ATC (final) est terminée dès le premier essai', () => {
    expect(flight.recordAttempt('0', { ...ko('Intention', 'pour un complet'), final: true }).done).toBe(true)
  })

  it('une réplique validée est terminée dès le premier essai', () => {
    expect(flight.recordAttempt('0', ok)).toMatchObject({ done: true, passed: true, attempts: 1 })
  })

  it('termine le vol après la dernière étape', () => {
    for (let i = 0; i < flight.steps.length; i++) flight.next()
    expect(flight.finished).toBe(true)
  })

  it('regroupe les éléments critiques ratés dans le bilan', () => {
    flight.recordAttempt('0', ko('Niveau', '110'))
    flight.recordAttempt('0', ko('Niveau', '110'))
    flight.next()
    flight.recordAttempt('0', ko('Niveau', '110'))
    flight.recordAttempt('0', ko('Niveau', '110'))
    flight.next()
    flight.recordAttempt('0', ok)

    const s = flight.summary
    expect(s).toMatchObject({ total: 3, passed: 1 })
    expect(s.missed).toHaveLength(1)
    expect(s.missed[0]).toMatchObject({ label: 'Niveau', value: '110', count: 2 })
    expect(s.missed[0].steps).toHaveLength(2)
  })

  it('abandonner remet le store à zéro', () => {
    flight.abort()
    expect(flight.active).toBe(false)
    expect(flight.steps).toEqual([])
  })
})

describe('flightStore.goTo', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('saute à une étape et efface ses résultats pour la rejouer', () => {
    const flight = useFlightStore()
    flight.start(SCENARIOS.find((s) => s.mode === 'IFR')!, 'débutant')
    flight.goTo(3)
    flight.recordAttempt('0', ok)
    flight.goTo(5)
    flight.goTo(3)
    expect(flight.index).toBe(3)
    expect(flight.outcomeOf('0')).toBeUndefined()
  })

  it('ignore un index hors limites', () => {
    const flight = useFlightStore()
    flight.start(SCENARIOS.find((s) => s.mode === 'IFR')!, 'débutant')
    flight.goTo(999)
    expect(flight.index).toBe(0)
  })
})
