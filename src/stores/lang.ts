import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Language } from './form'

/** Langue des échanges (phraséologie) : clé historique, du temps où elle réglait aussi l'interface */
const EXCHANGE_KEY = 'lang'
const UI_KEY = 'uiLang'

const isLanguage = (v: unknown): v is Language => v === 'fr' || v === 'en'

function read(key: string): Language | null {
  try {
    const v = localStorage.getItem(key)
    return isLanguage(v) ? v : null
  } catch {
    return null
  }
}

function write(key: string, lang: Language) {
  try {
    localStorage.setItem(key, lang)
  } catch {
    // Stockage indisponible : le choix vaut pour la session
  }
}

/** Langue imposée par l'adresse (?lang=en, lien depuis la page anglaise d'aeronautique.xyz) */
function fromUrl(): Language | null {
  if (typeof location === 'undefined') return null
  const v = new URLSearchParams(location.search).get('lang')
  return isLanguage(v) ? v : null
}

/** Première visite : français si le navigateur est en français, sinon anglais */
function fromBrowser(): Language {
  if (typeof navigator === 'undefined') return 'fr'
  return (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

/**
 * Deux langues indépendantes : celle de l'interface (`ui`) et celle des échanges pilote/ATC (`current`).
 * Un francophone peut ainsi s'entraîner à la phraséologie anglaise avec une interface en français.
 */
export const useLangStore = defineStore('lang', () => {
  const urlLang = fromUrl()
  if (urlLang) write(UI_KEY, urlLang)

  const ui = ref<Language>(read(UI_KEY) ?? fromBrowser())
  // Sans choix enregistré, les échanges suivent l'interface
  const current = ref<Language>(read(EXCHANGE_KEY) ?? ui.value)

  function changeLanguage(lang: Language) {
    current.value = lang
    write(EXCHANGE_KEY, lang)
  }

  function changeUiLanguage(lang: Language) {
    ui.value = lang
    write(UI_KEY, lang)
  }

  // Lecteurs d'écran et traduction automatique : langue du document = langue de l'interface
  watch(ui, (lang) => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang
  }, { immediate: true })

  return { ui, current, changeLanguage, changeUiLanguage }
})
