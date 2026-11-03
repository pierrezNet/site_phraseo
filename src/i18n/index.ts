/**
 * Traduction de l'interface (pas des échanges, qui suivent la langue des échanges).
 * Petit dictionnaire typé, sans dépendance : `t('clé', { param })`.
 */
import type { Language } from '../stores/form'
import { useLangStore } from '../stores/lang'
import { CRITICAL_TAGS } from '../utils/quizScoring'
import { fr, type MessageKey } from './fr'
import { en } from './en'

export type { MessageKey }

const MESSAGES: Record<Language, Record<MessageKey, string>> = { fr, en }

export type Params = Record<string, string | number>

/** Texte d'une clé dans une langue, `{nom}` remplacé par `params.nom` */
export function translate(lang: Language, key: MessageKey, params?: Params): string {
  const text = MESSAGES[lang]?.[key] ?? fr[key]
  return params ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : text
}

/** Libellé d'un élément critique (étiquette française interne, cf. CRITICAL_TAGS) dans la langue voulue */
export function criticalLabel(label: string, lang: Language): string {
  if (label === fr['critical.INTENT']) return translate(lang, 'critical.INTENT')
  const tag = Object.keys(CRITICAL_TAGS).find((k) => CRITICAL_TAGS[k] === label)
  const key = tag && (`critical.${tag}` as MessageKey)
  return key && key in fr ? translate(lang, key) : label
}

/** Texte en deux langues (données de phraséologie : noms des tâches, des étapes de vol…) */
export type Localized = Record<Language, string>

/** Nom d'une tâche dans la langue voulue (`_name_en`), le français à défaut */
export const taskName = (task: { _name?: string; _name_en?: string } | null | undefined, lang: Language): string =>
  (lang === 'en' && task?._name_en) || task?._name || ''

/** Nom court d'une tâche (boutons sur mobile) */
export const taskShort = (task: { _short?: string; _short_en?: string } | null | undefined, lang: Language): string =>
  (lang === 'en' && task?._short_en) || task?._short || ''

/** Nom d'un groupe de tâches (accordéon) : nom interne français, traduit à l'affichage */
export function groupLabel(name: string, lang: Language): string {
  const key = `group.${name}` as MessageKey
  return key in fr ? translate(lang, key) : name
}

/** Forum de la phraséologie (AvroBB), dans sa version anglaise (/en/) pour l'interface anglaise */
export const forumUrl = (lang: Language): string =>
  `https://avrobb.org${lang === 'en' ? '/en' : ''}/forum/4-phraseologie-aeronautique`

/** Heure locale « 02:00 » dans la langue de l'interface */
export const timeIn = (date: Date, lang: Language): string =>
  date.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })

/** Pour les composants : `t` suit la langue de l'interface (réactif dans les templates) */
export function useI18n() {
  const lang = useLangStore()
  const t = (key: MessageKey, params?: Params) => translate(lang.ui, key, params)
  return { t, lang }
}
