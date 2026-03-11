import { describe, it, expect } from 'vitest'
import { formatMetarData, replaceMetarTag } from './weatherFormatter'

const makeMetar = (overrides = {}) => ({
  wind_direction: { value: '240' },
  wind_speed: { value: '12' },
  temperature: { value: '18' },
  altimeter: { value: '1015' },
  ...overrides
})

// ── formatMetarData ───────────────────────────────────────────────────────────

describe('formatMetarData', () => {
  it('formate les données météo complètes en français', () => {
    const result = formatMetarData(makeMetar(), { lang: 'fr' })
    expect(result).toBe('vent 240 degrés 12 noeuds, température 18, Q_N_H 1015')
  })

  it('formate les données météo complètes en anglais', () => {
    const result = formatMetarData(makeMetar(), { lang: 'en' })
    expect(result).toBe('wind 240 degrees 12 knots, temperature 18, QNH 1015')
  })

  it('utilise les valeurs par défaut si les champs sont absents', () => {
    const result = formatMetarData({}, { lang: 'fr' })
    expect(result).toBe('vent variable degrés 0 noeuds, température 15, Q_N_H 1013')
  })

  it('accepte les données imbriquées sous .decoded', () => {
    const result = formatMetarData({ decoded: makeMetar() }, { lang: 'fr' })
    expect(result).toBe('vent 240 degrés 12 noeuds, température 18, Q_N_H 1015')
  })

  it('utilise la langue fr par défaut si options absent', () => {
    const result = formatMetarData(makeMetar())
    expect(result).toContain('degrés')
  })
})

// ── replaceMetarTag ───────────────────────────────────────────────────────────

describe('replaceMetarTag', () => {
  it('remplace [MET] par les informations météo', () => {
    const result = replaceMetarTag('[MET]', makeMetar(), { lang: 'fr' })
    expect(result).toBe('vent 240 degrés 12 noeuds, température 18, Q_N_H 1015')
  })

  it('remplace [MET] dans un texte plus long', () => {
    const result = replaceMetarTag('Météo en cours : [MET], bonne journée.', makeMetar(), { lang: 'fr' })
    expect(result).toContain('vent 240 degrés 12 noeuds')
    expect(result).toContain('Météo en cours :')
  })

  it('retourne le texte inchangé si pas de balise [MET]', () => {
    const result = replaceMetarTag('Aucune balise ici', makeMetar(), { lang: 'fr' })
    expect(result).toBe('Aucune balise ici')
  })

  it('retourne le texte inchangé si vide', () => {
    const result = replaceMetarTag('', makeMetar(), { lang: 'fr' })
    expect(result).toBe('')
  })
})
