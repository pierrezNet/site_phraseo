import { describe, it, expect } from 'vitest'
import { buildCriticals, callsignEquivalences, spelledRegistration, withSpelledRegistrations } from './criticals'
import { scoreAnswer, CRITICAL_TAGS } from './quizScoring'

describe('immatriculation épelée', () => {
  it('F-EPST s\'épelle F E P S T', () => {
    expect(spelledRegistration('F-EPST')).toEqual(['F E P S T'])
    expect(spelledRegistration('Air Europe 01')).toEqual([])
  })

  it('« Fox(trot) Echo Papa Sierra Tango » valide l\'indicatif F-EPST', () => {
    const eq = withSpelledRegistrations([['F S T', 'F-EPST']])
    const r = scoreAnswer('Foxtrot Echo Papa Sierra Tango, Cessna 172', 'F-EPST, Cessna 172.', [{ label: CRITICAL_TAGS.CAL, value: 'F-EPST' }], eq)
    expect(r.criticals[0].ok).toBe(true)
  })
})

describe('éléments critiques des pistes et niveaux', () => {
  const formStore = {
    form: { RWY: '26L', RWYA: '23', NIV: '110', NIVC: '230', SID: 'MIRGU 7H', STAR: 'EPINAL 9E' },
    formatRunway: (r: string) => r,
  } as never
  const weatherStore = { metarQnh: null } as never

  it('piste d’arrivée, niveau de croisière, SID et STAR', () => {
    expect(buildCriticals('Piste [RWYA], niveau [NIVC], [STAR]', 'fr', formStore, weatherStore)).toEqual([
      { label: 'Piste', value: '23' },
      { label: 'Niveau de croisière', value: '230' },
      { label: 'STAR', value: 'EPINAL 9E' },
    ])
  })

  it('vol local : la piste d’arrivée exigée est celle du départ', () => {
    expect(buildCriticals('Piste [RWYA]', 'fr', formStore, weatherStore, { RWYA: '[RWY]' })).toEqual([{ label: 'Piste', value: '26L' }])
  })
})

describe('indicatif « Air … » et reconnaissance vocale', () => {
  const formStore = { form: { CAL: 'Air Europe 012', CAA: 'Air Europe 012' } } as never
  const crit = [{ label: CRITICAL_TAGS.CAL, value: 'Air Europe 012' }]
  const expected = 'Je repousse, Air Europe 012.'

  it('« R Europe » accepté, à l’écrit comme à la voix', () => {
    expect(scoreAnswer('Je repousse R Europe 012', expected, crit, callsignEquivalences(formStore)).criticals[0].ok).toBe(true)
  })

  it('« Air » avalé : accepté seulement pour une réponse dite au micro', () => {
    const answer = 'Je repousse Europe 012'
    expect(scoreAnswer(answer, expected, crit, callsignEquivalences(formStore, { spoken: true })).criticals[0].ok).toBe(true)
    expect(scoreAnswer(answer, expected, crit, callsignEquivalences(formStore)).criticals[0].ok).toBe(false)
  })
})
