import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  tokenize,
  stripNotes,
  tokenSimilarity,
  scoreAnswer,
  PASS_THRESHOLD,
  CRITICAL_TAGS,
  requiredText,
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

  it('échoue si seules les valeurs sont dites, sans l\'indicatif', () => {
    const r = scoreAnswer('26 Gauche 1013', expected, [...criticals, { label: CRITICAL_TAGS.CAL, value: 'F S T' }])
    expect(r.criticals.find((c) => c.label === 'Indicatif')?.ok).toBe(false)
    expect(r.passed).toBe(false)
  })

  it('valide une réponse incomplète mais à 75 % et plus, critiques justes (cas réel 84 %)', () => {
    const r = scoreAnswer(
      'Orly sol bonjour, demande une mise en route, information E, Air Europe 01',
      'Orly Prévol, bonjour, Air Europe 01 en D2, demande mise en route pour Strasbourg, information E.',
      [
        { label: CRITICAL_TAGS.INF, value: 'E' },
        { label: CRITICAL_TAGS.CAL, value: 'Air Europe 01' },
      ]
    )
    expect(r.score).toBeGreaterThanOrEqual(PASS_THRESHOLD)
    expect(r.passed).toBe(true)
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

// ── Nombres dits en toutes lettres ────────────────────────────────────────────

describe('tokenize — nombres', () => {
  it('chiffres épelés, composés et en chiffres donnent le même nombre', () => {
    const ref = ['niveau', '110']
    expect(tokenize('niveau 110')).toEqual(ref)
    expect(tokenize('niveau 1_1_0')).toEqual(ref)
    expect(tokenize('niveau un un zéro')).toEqual(ref)
    expect(tokenize('niveau cent dix')).toEqual(ref)
    expect(tokenize('level one one zero')).toEqual(['level', '110'])
  })

  it('compose les nombres français', () => {
    expect(tokenize('quatre mille')).toEqual(['4000'])
    expect(tokenize('deux mille cinq cents')).toEqual(['2500'])
    expect(tokenize('quatre-vingt-dix')).toEqual(['90'])
    expect(tokenize('soixante et onze')).toEqual(['71'])
    expect(tokenize('mille vingt')).toEqual(['1020'])
    expect(tokenize('trois cent soixante')).toEqual(['360'])
  })

  it('compose les nombres anglais et la prononciation OACI', () => {
    expect(tokenize('two thousand five hundred')).toEqual(['2500'])
    expect(tokenize('tree fife niner')).toEqual(['359'])
  })

  it('regroupe l\'heure épelée 1_5_5_5 avec 1555', () => {
    expect(tokenize('1_5_5_5')).toEqual(tokenize('1555'))
  })

  it('sépare lettre et nombre d\'un point d\'attente', () => {
    expect(tokenize('W41')).toEqual(['w', '41'])
    expect(tokenize('whiskey quatre un')).toEqual(['w', '41'])
  })

  it('normalise la décimale des fréquences', () => {
    expect(tokenize('118.7')).toEqual(['118', 'decimale', '7'])
    expect(tokenize('118 decimal 7')).toEqual(['118', 'decimale', '7'])
  })
})

describe('scoreAnswer — nouveaux éléments critiques', () => {
  it('accepte un niveau dit en toutes lettres', () => {
    const r = scoreAnswer('Je monte niveau un un zéro, F E P', 'Je monte niveau 110, F E P', [
      { label: CRITICAL_TAGS.NIV, value: '110' },
    ])
    expect(r.passed).toBe(true)
  })

  it('refuse un code transpondeur faux', () => {
    const criticals = [{ label: CRITICAL_TAGS.SQU, value: '7001' }]
    const expected = 'Je roule point d\'attente, transpondeur 7001, F E P'
    expect(scoreAnswer('je roule point d\'attente transpondeur 7010 F E P', expected, criticals).passed).toBe(false)
    expect(scoreAnswer('je roule point d\'attente transpondeur sept zéro zéro un F E P', expected, criticals).passed).toBe(true)
  })

  it('contrôle le point d\'attente et la lettre ATIS', () => {
    const criticals = [
      { label: CRITICAL_TAGS.HLD, value: 'W41' },
      { label: CRITICAL_TAGS.INF, value: 'C' },
    ]
    const expected = 'Je roule point d\'attente W41, avec information Charlie, F E P'
    const ok = scoreAnswer('je roule point d\'attente whiskey quatre un avec information charlie F E P', expected, criticals)
    expect(ok.passed).toBe(true)
    const ko = scoreAnswer('je roule point d\'attente whiskey quatre deux avec information charlie F E P', expected, criticals)
    expect(ko.criticals.find((c) => c.label === CRITICAL_TAGS.HLD)?.ok).toBe(false)
    expect(ko.passed).toBe(false)
  })
})

describe('requiredText — parenthèses = valeur libre ou segment optionnel', () => {
  it('retire les valeurs d\'exemple et les notes', () => {
    expect(requiredText('Je tourne à (droite) cap (220){note}, F E P')).toBe('Je tourne à cap , F E P')
  })

  it('une autre valeur que l\'exemple ne pénalise pas le rappel', () => {
    const expected = requiredText('Je réduis (220) nœuds, F E P')
    expect(scoreAnswer('je réduis 250 nœuds F E P', expected, []).passed).toBe(true)
  })

  it('accepte une fréquence dite en toutes lettres', () => {
    const r = scoreAnswer('je contacte tour cent dix-huit décimale sept F E P', 'Je contacte Tour, 118 décimale 7, F E P', [
      { label: CRITICAL_TAGS.TWR, value: '118 décimale 7' },
    ])
    expect(r.passed).toBe(true)
  })
})
