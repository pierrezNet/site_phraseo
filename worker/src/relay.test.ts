import { describe, it, expect } from 'vitest'
import { discordPayload, parseFeedback, toMetar, visibilityMeters } from './relay'

// ── METAR NOAA → format front ─────────────────────────────────────────────────

describe('toMetar', () => {
  const noaa = {
    icaoId: 'LFPG',
    rawOb: 'METAR LFPG 270700Z 17003KT 140V200 6000 NSC 15/13 Q1018 NOSIG',
    temp: 15,
    wdir: 170,
    wspd: 3,
    visib: 3.73,
    altim: 1018,
  }

  it('convertit la réponse NOAA', () => {
    expect(toMetar(noaa)).toEqual({
      station: 'LFPG',
      raw: noaa.rawOb,
      altimeter: { value: 1018 },
      temperature: { value: 15 },
      wind_direction: { value: 170 },
      wind_speed: { value: 3 },
      visibility: { value: 6000 },
    })
  })

  it('traite le vent variable comme une direction absente', () => {
    expect(toMetar({ ...noaa, wdir: 'VRB' }).wind_direction.value).toBeNull()
  })

  it('arrondit le QNH', () => {
    expect(toMetar({ ...noaa, altim: 1017.6 }).altimeter.value).toBe(1018)
  })
})

describe('visibilityMeters', () => {
  it('convertit les miles en mètres arrondis à la centaine', () => {
    expect(visibilityMeters(3.73)).toBe(6000)
  })
  it('renvoie 9999 pour "10+" et plafonne à 9999', () => {
    expect(visibilityMeters('10+')).toBe(9999)
    expect(visibilityMeters(10)).toBe(9999)
  })
  it('renvoie null si absente ou illisible', () => {
    expect(visibilityMeters(null)).toBeNull()
    expect(visibilityMeters('abc')).toBeNull()
  })
})

// ── Feedback ──────────────────────────────────────────────────────────────────

describe('parseFeedback', () => {
  const valid = {
    type: 'Bug technique',
    message: '  Le QNH ne se met pas à jour  ',
    contact: 'pilote@example.org',
    mode: 'VFR',
    level: 'débutant',
    lang: 'fr',
  }

  it('accepte et nettoie un retour valide', () => {
    expect(parseFeedback(valid)).toEqual({ ...valid, message: 'Le QNH ne se met pas à jour' })
  })

  it('refuse un type inconnu', () => {
    expect(parseFeedback({ ...valid, type: 'Spam' })).toBeNull()
  })

  it('refuse un message vide ou trop long', () => {
    expect(parseFeedback({ ...valid, message: '   ' })).toBeNull()
    expect(parseFeedback({ ...valid, message: 'a'.repeat(1801) })).toBeNull()
  })

  it('refuse un mode ou une langue invalides', () => {
    expect(parseFeedback({ ...valid, mode: 'XYZ' })).toBeNull()
    expect(parseFeedback({ ...valid, lang: 'de' })).toBeNull()
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    expect(parseFeedback(null)).toBeNull()
    expect(parseFeedback('texte')).toBeNull()
  })
})

describe('discordPayload', () => {
  it('désactive toutes les mentions Discord', () => {
    const f = parseFeedback({ type: 'Autre', message: '@everyone test', contact: '', mode: '', level: '', lang: '' })!
    const p = discordPayload(f)
    expect(p.allowed_mentions).toEqual({ parse: [] })
    expect(p.embeds[0].fields.map((x) => x.value)).toEqual(['—', '—', '—', '—'])
  })
})
