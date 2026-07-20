import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  tokenize,
  stripNotes,
  tokenSimilarity,
  scoreAnswer,
  PASS_THRESHOLD,
} from './quizScoring'

describe('normalizeText', () => {
  it('retire accents, casse et ponctuation', () => {
    expect(normalizeText('Piste 26 Gauche, Q_N_H 1013.')).toBe('piste 26 gauche q n h 1013')
  })

  it('traite les underscores phonétiques comme des espaces', () => {
    expect(normalizeText('Q_N_H')).toBe('q n h')
  })
})

describe('tokenize', () => {
  it('regroupe les lettres épelées en un mot', () => {
    expect(tokenize('Q_N_H 1013')).toEqual(['qnh', '1013'])
    expect(tokenize('F E P')).toEqual(['fep'])
  })

  it('laisse une lettre isolée telle quelle', () => {
    expect(tokenize('F-STEP')).toEqual(['f', 'step'])
  })
})

describe('stripNotes', () => {
  it('supprime les notes {…}', () => {
    expect(stripNotes('Je décolle {note explicative} piste 26')).toBe('Je décolle piste 26')
  })
})

describe('tokenSimilarity', () => {
  it('donne 100 pour une réponse identique', () => {
    expect(tokenSimilarity('Piste 26 Gauche', 'piste 26 gauche')).toBe(100)
  })

  it('reste élevé malgré des mots en trop (rappel privilégié)', () => {
    // tous les mots attendus sont là, plus des mots superflus
    expect(tokenSimilarity('piste 23 qnh 1023', 'piste 23 qnh 1023 niveau de transition 60')).toBeGreaterThanOrEqual(70)
  })

  it('QNH et Q_N_H sont équivalents', () => {
    expect(tokenSimilarity('Q_N_H 1013', 'QNH 1013')).toBe(100)
  })
})

describe('scoreAnswer', () => {
  const expected = 'Piste 26 Gauche, Q_N_H 1013, F S T.'
  const criticals = [
    { label: 'Piste', value: '26 Gauche' },
    { label: 'QNH', value: '1013' },
  ]

  it('valide une réponse correcte avec tous les critiques', () => {
    const r = scoreAnswer('Piste 26 gauche, QNH 1013, F S T.', expected, criticals)
    expect(r.passed).toBe(true)
    expect(r.criticals.every((c) => c.ok)).toBe(true)
    expect(r.score).toBeGreaterThanOrEqual(PASS_THRESHOLD)
  })

  it('échoue si un critique est faux même avec bonne similarité', () => {
    const r = scoreAnswer('Piste 26 gauche, QNH 1012, F S T.', expected, criticals)
    expect(r.passed).toBe(false)
    expect(r.criticals.find((c) => c.label === 'QNH')?.ok).toBe(false)
  })

  it('échoue si trop de mots attendus manquent (rappel insuffisant)', () => {
    const r = scoreAnswer('26 Gauche 1013', expected, criticals)
    expect(r.criticals.every((c) => c.ok)).toBe(true)
    expect(r.passed).toBe(false)
  })

  // ── cas réels remontés par l'utilisateur (avant : 68 % / 42 % « à revoir ») ──

  it('valide un callsign déplacé et écrit F-STEP (ex. réel 68 %)', () => {
    const r = scoreAnswer(
      'Demande paramètres pour le départ, F-STEP',
      'F E P, Demande paramètres pour le départ.',
      []
    )
    expect(r.passed).toBe(true)
  })

  it('valide un readback avec mots en trop quand les critiques sont bons (ex. réel 42 %)', () => {
    const r = scoreAnswer(
      'Piste 23, QNH 1023, niveau de transition 60, F-STEP',
      'Piste 23, Q_N_H 1023, F E P.',
      [
        { label: 'Piste', value: '23' },
        { label: 'QNH', value: '1023' },
      ]
    )
    expect(r.passed).toBe(true)
    expect(r.score).toBeGreaterThanOrEqual(PASS_THRESHOLD)
  })
})

describe('équivalences justes', () => {
  it('alphabet OACI : "information Lima" équivaut à "information L"', () => {
    expect(tokenSimilarity('information L', 'information Lima')).toBe(100)
  })

  it('callsign complet (F-STEP) accepté là où l\'abrégé (F E P) est attendu', () => {
    const r = scoreAnswer(
      'Demande paramètres pour le départ, F-STEP',
      'F E P, Demande paramètres pour le départ.',
      [],
      [['F E P', 'F-STEP']]
    )
    expect(r.passed).toBe(true)
    expect(r.accessory).toBe(100)
  })
})

describe('phraséologie exigeante (reformulations refusées)', () => {
  it('refuse une reformulation libre : "je demande les paramètres du départ"', () => {
    const r = scoreAnswer(
      'F-STEP, je demande les paramètres du départ',
      'F E P, Demande paramètres pour le départ.',
      [],
      [['F E P', 'F-STEP']]
    )
    expect(r.passed).toBe(false)
  })

  it('refuse une omission d\'éléments attendus (Cessna 172, parking…)', () => {
    const r = scoreAnswer(
      "FEP, je demande les consignes de roulage pour un vol à destination de Colmar avec l'information Lima",
      'F E P, Cessna 172, parking aviation générale, demande consignes roulage pour vol à destination de Colmar avec information L.',
      [],
      [['F E P', 'FEP']]
    )
    expect(r.passed).toBe(false)
  })
})
