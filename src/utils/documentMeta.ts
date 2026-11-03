/**
 * Titre, description et adresse canonique de la page dans la langue de l'interface.
 * Chaque langue a son adresse (?lang=fr, ?lang=en) ; la racine choisit selon le navigateur (x-default).
 * index.html porte la version française, lue sans JavaScript.
 */
import type { Language } from '../stores/form'
import { translate } from '../i18n'

const SITE = 'https://phraseo.aeronautique.xyz/'

function setMeta(selector: string, content: string) {
  document.querySelector(selector)?.setAttribute('content', content)
}

export function applyDocumentMeta(lang: Language) {
  if (typeof document === 'undefined') return
  const title = translate(lang, 'meta.title')
  const description = translate(lang, 'meta.description')
  document.documentElement.lang = lang
  document.title = title
  setMeta('meta[name="description"]', description)
  setMeta('meta[property="og:title"]', title)
  setMeta('meta[property="og:description"]', description)
  setMeta('meta[property="og:locale"]', lang === 'en' ? 'en_GB' : 'fr_FR')
  setMeta('meta[property="og:locale:alternate"]', lang === 'en' ? 'fr_FR' : 'en_GB')
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${SITE}?lang=${lang}`)
}
