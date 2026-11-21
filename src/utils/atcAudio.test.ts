import { describe, it, expect, beforeEach, vi } from 'vitest'

// Module rechargé à chaque test : le tirage est mémorisé par module
const load = async () => (await import('./atcAudio')).voiceGenders

describe('voiceGenders', () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
  })

  it('tire le genre de l’ATC et du pilote indépendamment', async () => {
    const draws = [0.2, 0.8]
    const voiceGenders = await load()
    expect(voiceGenders(() => draws.shift()!)).toEqual({ atc: 'f', pilot: 'm' })
  })

  it('garde le tirage pour la session (onglet), même après rechargement de la page', async () => {
    const first = (await load())(() => 0.9)
    vi.resetModules()
    expect((await load())(() => 0.1)).toEqual(first)
  })

  it('nouveau tirage si la mémoire de session est illisible', async () => {
    sessionStorage.setItem('voiceGenders', '{"atc":"x"}')
    expect((await load())(() => 0.1)).toEqual({ atc: 'f', pilot: 'f' })
  })
})
