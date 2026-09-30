import { describe, it, expect } from 'vitest'
import { detectRemarks, isRogerInsteadOfReadback } from './debrief'

const callsign = { cal: 'F-EPST', caa: 'F S T' }

describe('detectRemarks — indicatif abrégé trop tôt', () => {
  it('signale l\'abrégé quand le complet est attendu', () => {
    expect(detectRemarks({ source: '[DEP] [NTWR], [CAL], [POL].', expected: '', answer: 'Strasbourg Tour, FST, bonjour', callsign })).toContain('CALLSIGN_ABBREVIATED_EARLY')
  })

  it('ne dit rien si le complet est employé', () => {
    expect(detectRemarks({ source: '[DEP] [NTWR], [CAL], [POL].', expected: '', answer: 'Strasbourg Tour, F-EPST, bonjour', callsign })).toEqual([])
  })

  it('ne dit rien quand l\'abrégé est attendu (l\'ATC a abrégé)', () => {
    expect(detectRemarks({ source: 'Piste [RWY], j\'atterris, [CAA].', expected: '', answer: 'Piste 23, j\'atterris, FST', callsign })).toEqual([])
  })

  it('ne dit rien si complet et abrégé sont identiques (indicatif de type compagnie)', () => {
    const airline = { cal: 'Air Europe 01', caa: 'Air Europe 01' }
    expect(detectRemarks({ source: '[CAL], demande roulage.', expected: '', answer: 'Air Europe 01, demande roulage', callsign: airline })).toEqual([])
  })
})

describe('detectRemarks — expression réservée à l\'ATC', () => {
  it.each([
    'Piste 23, autorisé atterrissage, FST',
    'autorisé décollage piste 23, FST',
    'Runway 23, cleared to land, FST',
    'cleared for take-off runway 23, FST',
  ])('signale « %s »', (answer) => {
    expect(detectRemarks({ source: 'Piste [RWY], j\'atterris, [CAA].', expected: '', answer, callsign })).toContain('ATC_RESERVED')
  })

  it('accepte le verbe d\'action', () => {
    expect(detectRemarks({ source: 'Piste [RWY], j\'atterris, [CAA].', expected: '', answer: 'Piste 23, j\'atterris, FST', callsign })).toEqual([])
  })
})

describe('« Roger » à la place du collationnement', () => {
  const expected = 'Transpondeur 7001, je roule au point d\'attente piste 23, F S T.'

  it('est détecté quand seul « Roger » et l\'indicatif sont dits', () => {
    expect(isRogerInsteadOfReadback({ expected, answer: 'Roger, F S T', callsign })).toBe(true)
    expect(detectRemarks({ source: '', expected, answer: 'Roger F-EPST', callsign })).toContain('ROGER_INSTEAD_OF_READBACK')
  })

  it('est accepté quand « Roger » est la réponse attendue', () => {
    expect(isRogerInsteadOfReadback({ expected: 'Roger, F S T.', answer: 'Roger, F S T', callsign })).toBe(false)
  })

  it('est accepté devant un collationnement complet', () => {
    expect(isRogerInsteadOfReadback({ expected, answer: 'Roger, transpondeur 7001, je roule point d\'attente piste 23, F S T', callsign })).toBe(false)
  })
})

describe('valeur sans son unité', () => {
  const expected = 'Je monte 2500 pieds, je réduis 220 nœuds, F S T.'

  it('est signalée quand l\'unité manque', () => {
    expect(detectRemarks({ source: '', expected, answer: 'Je monte 2500, je réduis 220 nœuds, F S T', callsign })).toContain('MISSING_UNIT')
    expect(detectRemarks({ source: '', expected, answer: 'Je monte 2500 pieds, je réduis 220, F S T', callsign })).toContain('MISSING_UNIT')
  })

  it('ne dit rien avec les unités', () => {
    expect(detectRemarks({ source: '', expected, answer: 'Je monte deux mille cinq cents pieds, je réduis 220 nœuds, F S T', callsign })).toEqual([])
  })
})
