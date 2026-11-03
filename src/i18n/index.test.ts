import { describe, it, expect } from 'vitest'
import { criticalLabel, translate } from './index'
import { fr } from './fr'
import { en } from './en'
import { quotaMessage } from '../stores/voice'
import { checkSelcal } from '../utils/selcal'
import { CRITICAL_TAGS } from '../utils/quizScoring'

describe('traduction de l’interface', () => {
  it('chaque texte anglais garde les paramètres du français', () => {
    const params = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const key of Object.keys(fr) as (keyof typeof fr)[]) expect(params(en[key]), key).toEqual(params(fr[key]))
  })

  it('remplace les paramètres', () => {
    expect(translate('fr', 'flight.step', { n: 3, total: 12 })).toBe('Étape 3 / 12')
    expect(translate('en', 'flight.step', { n: 3, total: 12 })).toBe('Step 3 / 12')
  })

  it('libellés des éléments critiques : étiquette interne française, affichage traduit', () => {
    expect(criticalLabel(CRITICAL_TAGS.RWYA, 'en')).toBe('Runway')
    expect(criticalLabel(CRITICAL_TAGS.CAL, 'en')).toBe('Callsign')
    expect(criticalLabel('Intention', 'en')).toBe('Intention')
    expect(criticalLabel(CRITICAL_TAGS.NIVC, 'fr')).toBe('Niveau de croisière')
    expect(criticalLabel('Inconnu', 'en')).toBe('Inconnu')
  })

  it('tout élément critique a son libellé dans le dictionnaire', () => {
    for (const label of Object.values(CRITICAL_TAGS)) expect(criticalLabel(label, 'fr'), label).toBe(label)
  })

  it('messages des utilitaires en anglais', () => {
    expect(quotaMessage('user', new Date('2026-11-03T10:00:00Z'), 'en')).toMatch(/^Today’s voice quota is used up/)
    expect(checkSelcal('AD-DS', 'en').reasons).toContain('The 4 letters must all be different.')
  })
})
