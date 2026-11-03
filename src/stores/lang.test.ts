import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLangStore } from './lang'

const setBrowser = (language: string) => Object.defineProperty(navigator, 'language', { value: language, configurable: true })

describe('langues de l’interface et des échanges', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    setBrowser('fr-FR')
    history.replaceState(null, '', '/')
  })

  it('première visite : interface dans la langue du navigateur, échanges dans la même langue', () => {
    setBrowser('en-US')
    const lang = useLangStore()
    expect(lang.ui).toBe('en')
    expect(lang.current).toBe('en')
  })

  it('interface française avec des échanges en anglais, choix retenus', () => {
    const lang = useLangStore()
    lang.changeLanguage('en')
    expect(lang.ui).toBe('fr')
    expect(lang.current).toBe('en')
    setActivePinia(createPinia())
    const again = useLangStore()
    expect([again.ui, again.current]).toEqual(['fr', 'en'])
  })

  it('ancien réglage unique (« lang ») : il reste celui des échanges', () => {
    localStorage.setItem('lang', 'en')
    const lang = useLangStore()
    expect([lang.ui, lang.current]).toEqual(['fr', 'en'])
  })

  it('?lang=en impose l’interface anglaise et la retient', () => {
    history.replaceState(null, '', '/?lang=en')
    expect(useLangStore().ui).toBe('en')
    expect(localStorage.getItem('uiLang')).toBe('en')
  })

  it('langue, titre et adresse canonique de la page suivent l’interface', async () => {
    document.head.innerHTML = '<link rel="canonical" href="https://phraseo.aeronautique.xyz/"><meta name="description" content="">'
    const lang = useLangStore()
    lang.changeUiLanguage('en')
    await Promise.resolve()
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('Aviation phraseology for virtual pilots')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toMatch(/^VFR and IFR/)
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://phraseo.aeronautique.xyz/?lang=en')
  })
})
