import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFormStore } from './form'

describe('formStore', () => {
  let store: ReturnType<typeof useFormStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useFormStore()
  })

  // ── formatRunway ────────────────────────────────────────────────────────────

  describe('formatRunway', () => {
    it('26L → "26 Gauche" en français', () => {
      expect(store.formatRunway('26L', 'fr')).toBe('26 Gauche')
    })

    it('26L → "26 Left" en anglais', () => {
      expect(store.formatRunway('26L', 'en')).toBe('26 Left')
    })

    it('09R → "09 Droite" en français', () => {
      expect(store.formatRunway('09R', 'fr')).toBe('09 Droite')
    })

    it('10C → "10 Center" en anglais', () => {
      expect(store.formatRunway('10C', 'en')).toBe('10 Center')
    })

    it('27 (sans lettre) → "27"', () => {
      expect(store.formatRunway('27', 'fr')).toBe('27')
    })

    it('chaîne vide → chaîne vide', () => {
      expect(store.formatRunway('', 'fr')).toBe('')
    })
  })

  // ── formatFrequency ─────────────────────────────────────────────────────────

  describe('formatFrequency — français', () => {
    it('121.050 → "121 décimale 0_50"  (décimale < 0.091)', () => {
      expect(store.formatFrequency('121.050', 'fr')).toBe('121 décimale 0_50')
    })

    it('118.700 → "118 décimale unité"  (décimale multiple de 100)', () => {
      expect(store.formatFrequency('118.700', 'fr')).toBe('118 décimale unité')
    })

    it('122.800 → "122 décimale unité"  (décimale multiple de 100)', () => {
      expect(store.formatFrequency('122.800', 'fr')).toBe('122 décimale unité')
    })

    it('121.825 → "121 décimale 825"  (décimale standard)', () => {
      expect(store.formatFrequency('121.825', 'fr')).toBe('121 décimale 825')
    })

    it('123.875 → "123 décimale 875"  (décimale standard)', () => {
      expect(store.formatFrequency('123.875', 'fr')).toBe('123 décimale 875')
    })

    it('entrée invalide → "ENTRÉE INVALIDE"', () => {
      expect(store.formatFrequency('abc', 'fr')).toBe('ENTRÉE INVALIDE')
    })

    it('chaîne vide → "ENTRÉE INVALIDE"', () => {
      expect(store.formatFrequency('', 'fr')).toBe('ENTRÉE INVALIDE')
    })
  })

  describe('formatFrequency — anglais', () => {
    it('121.050 → "1_2_1 decimal 0_5_0"', () => {
      expect(store.formatFrequency('121.050', 'en')).toBe('1_2_1 decimal 0_5_0')
    })

    it('118.700 → "1_1_8 decimal 7"  (décimale multiple de 100)', () => {
      expect(store.formatFrequency('118.700', 'en')).toBe('1_1_8 decimal 7')
    })

    it('121.825 → "1_2_1 decimal 8_2_5"', () => {
      expect(store.formatFrequency('121.825', 'en')).toBe('1_2_1 decimal 8_2_5')
    })

    it('entrée invalide → "INVALID INPUT"', () => {
      expect(store.formatFrequency('abc', 'en')).toBe('INVALID INPUT')
    })
  })
})
