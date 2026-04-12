import { describe, it, expect, vi, afterEach } from 'vitest'
import { getHeure, POL_STRINGS, replacePlaceholders, resolveStation } from './phraseoHelpers'

const makeFormStore = (overrides = {}) => ({
  form: {
    CAA: 'Air Europe 01',
    RWY: '26L',
    DEL: '121.050',
    GND: '121.825',
    TWR: '118.700',
    APP: '123.875',
    CTR: '125.100',
    ...overrides,
  },
  frequencyLabels: {
    NDEL: { fr: 'Prévol', en: 'Delivery' },
    NGND: { fr: 'Sol', en: 'Ground' },
    NTWR: { fr: 'Tour', en: 'Tower' },
    NAPP: { fr: 'Approche', en: 'Approach' },
    NCTR: { fr: 'Contrôle', en: 'Control' },
    NUNI: { fr: 'UNICOM', en: 'UNICOM' },
  },
  formatFrequency: (freq: string) => freq,
  formatRunway: (rwy: string) => rwy,
})

const makeWeatherStore = (overrides = {}) => ({
  loading: false,
  metarData: null,
  ...overrides,
})

// ── getHeure ──────────────────────────────────────────────────────────────────

describe('getHeure', () => {
  afterEach(() => vi.useRealTimers())

  it('returns "matin" at 10h00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T10:00:00'))
    expect(getHeure()).toBe('matin')
  })

  it('returns "soir" at 20h00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T20:00:00'))
    expect(getHeure()).toBe('soir')
  })

  it('returns "matin" à 18h59 (limite basse)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T18:59:00'))
    expect(getHeure()).toBe('matin')
  })

  it('returns "soir" à 19h00 (limite haute)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T19:00:00'))
    expect(getHeure()).toBe('soir')
  })
})

// ── POL_STRINGS ───────────────────────────────────────────────────────────────

describe('POL_STRINGS', () => {
  it('contient les formules de politesse françaises', () => {
    expect(POL_STRINGS.matin.fr).toBe('bonjour')
    expect(POL_STRINGS.soir.fr).toBe('bonsoir')
  })

  it('contient les formules de politesse anglaises', () => {
    expect(POL_STRINGS.matin.en).toBe('hello')
    expect(POL_STRINGS.soir.en).toBe('good evening')
  })
})

// ── replacePlaceholders ───────────────────────────────────────────────────────

describe('replacePlaceholders', () => {
  const formStore = makeFormStore()
  const weatherStore = makeWeatherStore()

  it('remplace [CAA] par le callsign', () => {
    const result = replacePlaceholders('[CAA]', 'fr', formStore as any, weatherStore as any)
    expect(result).toBe('Air Europe 01')
  })

  it('remplace [RWY] par la piste formatée', () => {
    const result = replacePlaceholders('piste [RWY]', 'fr', formStore as any, weatherStore as any)
    expect(result).toBe('piste 26L')
  })

  it('laisse le texte inchangé sans placeholder', () => {
    const result = replacePlaceholders('rien à remplacer', 'fr', formStore as any, weatherStore as any)
    expect(result).toBe('rien à remplacer')
  })

  it('retourne "chargement..." pour [MET] si la météo charge (fr)', () => {
    const store = makeWeatherStore({ loading: true })
    const result = replacePlaceholders('[MET]', 'fr', formStore as any, store as any)
    expect(result).toBe('chargement...')
  })

  it('retourne "loading..." pour [MET] si la météo charge (en)', () => {
    const store = makeWeatherStore({ loading: true })
    const result = replacePlaceholders('[MET]', 'en', formStore as any, store as any)
    expect(result).toBe('loading...')
  })

  it('retourne le fallback météo si pas de données', () => {
    const result = replacePlaceholders('[MET]', 'fr', formStore as any, weatherStore as any)
    expect(result).toContain('vent (240) degrés (10) noeuds')
  })

  it('conserve le placeholder original pour un tag inconnu', () => {
    const result = replacePlaceholders('[INCONNU]', 'fr', formStore as any, weatherStore as any)
    expect(result).toBe('[INCONNU]')
  })

  it('retourne "Station" si CAA est vide', () => {
    const store = makeFormStore({ CAA: '' })
    const result = replacePlaceholders('[CAA]', 'fr', store as any, weatherStore as any)
    expect(result).toBe('Station')
  })
})

// ── resolveStation ────────────────────────────────────────────────────────────

describe('resolveStation', () => {
  it('retourne label + fréquence si la fréquence est renseignée', () => {
    const store = makeFormStore()
    // TWR = '118.700' → 'Tour, 118.700' (formatFrequency est identity dans le stub)
    const result = resolveStation('TWR', 'fr', store as any)
    expect(result).toBe('Tour, 118.700')
  })

  it('retourne le label en anglais', () => {
    const store = makeFormStore()
    const result = resolveStation('TWR', 'en', store as any)
    expect(result).toBe('Tower, 118.700')
  })

  it('fallback vers APP si TWR est vide', () => {
    const store = makeFormStore({ TWR: '' })
    // APP = '123.875'
    const result = resolveStation('TWR', 'fr', store as any)
    expect(result).toBe('Approche, 123.875')
  })

  it('fallback vers CTR si TWR et APP sont vides', () => {
    const store = makeFormStore({ TWR: '', APP: '' })
    const result = resolveStation('TWR', 'fr', store as any)
    expect(result).toBe('Contrôle, 125.100')
  })

  it('retourne uniquement le label si aucune fréquence disponible', () => {
    const store = makeFormStore({ TWR: '', APP: '', CTR: '' })
    const result = resolveStation('TWR', 'fr', store as any)
    expect(result).toBe('Tour')
  })
})
