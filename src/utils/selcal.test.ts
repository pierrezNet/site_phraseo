import { describe, it, expect } from 'vitest'
import { checkSelcal, formatSelcal, spellSelcal } from './selcal'

describe('checkSelcal', () => {
  it('accepte un code valide, avec ou sans tiret, en minuscules', () => {
    expect(checkSelcal('AD-RS')).toMatchObject({ valid: true, letters: ['A', 'D', 'R', 'S'] })
    expect(checkSelcal('adrs').valid).toBe(true)
    expect(checkSelcal('CD-AB').valid).toBe(true) // aucune contrainte entre les paires
  })

  it('refuse lettre hors des 16 tonalités, doublon, paire hors ordre, longueur', () => {
    expect(checkSelcal('AN-RS').reasons[0]).toMatch(/« N »/)
    expect(checkSelcal('AD-DS').reasons).toContain('Les 4 lettres doivent être différentes.')
    expect(checkSelcal('AD-SR').valid).toBe(false) // R précède S
    expect(checkSelcal('ADR').reasons).toContain('Le code doit comporter 4 lettres.')
  })
})

describe('formatSelcal / spellSelcal', () => {
  it('format officiel et épellation OACI', () => {
    expect(formatSelcal(['A', 'D', 'R', 'S'])).toBe('AD-RS')
    expect(spellSelcal('ad-rs')).toBe('Alpha-Delta-Romeo-Sierra')
  })

  it('saisie invalide : code par défaut', () => {
    expect(spellSelcal('')).toBe('Alpha-Delta-Romeo-Sierra')
  })
})

describe('notation du contrôle SELCAL', () => {
  it('code épelé ou écrit, toujours exigé', async () => {
    const { scoreAnswer, requiredText } = await import('./quizScoring')
    const { selcalEquivalences } = await import('./criticals')
    const formStore = { form: { SEL: 'AD-RS' } } as never
    const expected = requiredText('(Gander Radio), Air Europe 012, requesting SELCAL check, code Alpha-Delta-Romeo-Sierra.')
    const crit = [{ label: 'Code SELCAL', value: 'Alpha-Delta-Romeo-Sierra' }]
    const eq = selcalEquivalences(formStore)
    for (const answer of ['Gander Radio, Air Europe 012, requesting SELCAL check, code Alpha Delta Romeo Sierra', '…check, code AD-RS', '…check, code ADRS']) {
      expect(scoreAnswer(answer.replace('…', 'Gander Radio, Air Europe 012, requesting SELCAL '), expected, crit, eq).criticals[0].ok).toBe(true)
    }
    expect(scoreAnswer('Gander Radio, Air Europe 012, requesting SELCAL check, code Alpha Delta Sierra Romeo', expected, crit, eq).passed).toBe(false)
  })
})
