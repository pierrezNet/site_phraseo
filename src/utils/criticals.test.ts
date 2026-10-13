import { describe, it, expect } from 'vitest'
import { spelledRegistration, withSpelledRegistrations } from './criticals'
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
