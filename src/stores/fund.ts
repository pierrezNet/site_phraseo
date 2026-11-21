import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get } from '../utils/api'
import { API_BASE } from '../utils/relay'
import { SUPPORT_DEMO, SUPPORT_URL } from '../utils/support'

/** Fonds du collectif, tel que renvoyé par le relais (GET /fund) ; montants en centimes */
export interface Fund {
  active: boolean
  currency: string
  balance: number
  received: number
  spent: number
  expenseCount: number
  expenses: { description: string; date: string; amount: number }[]
}

/** Fonds fictif du mode démo (développement, `?soutien=demo`) */
const DEMO_FUND: Fund = {
  active: true,
  currency: 'EUR',
  balance: 7530,
  received: 12000,
  spent: 4470,
  expenseCount: 3,
  expenses: [
    { description: 'Microsoft Azure — voix françaises — décembre 2026 (démo)', date: '2027-01-04', amount: 1250 },
    { description: 'Cloudflare — offre Workers et voix anglaises — décembre 2026 (démo)', date: '2027-01-04', amount: 820 },
    { description: 'Nom de domaine aeronautique.xyz — 2027 (démo)', date: '2026-12-20', amount: 1400 },
  ],
}

/**
 * Transparence des dons : solde, totaux et dernières dépenses du collectif Open Collective.
 * Chargé une fois, à la première demande ; affiché seulement quand le collectif est actif et le soutien ouvert.
 */
export const useFundStore = defineStore('fund', () => {
  const fund = ref<Fund | null>(null)
  let request: Promise<void> | null = null

  /** À afficher : soutien ouvert (SUPPORT_URL) et collectif accepté par son hôte */
  const visible = computed(() => !!SUPPORT_URL && !!fund.value?.active)

  function load(): Promise<void> {
    if (SUPPORT_DEMO) {
      fund.value = DEMO_FUND
      return Promise.resolve()
    }
    if (!SUPPORT_URL || !API_BASE) return Promise.resolve()
    request ??= get<Fund>(`${API_BASE}/fund`)
      .then((data) => {
        fund.value = data
      })
      .catch((err) => {
        // Sans données, rien ne s'affiche ; nouvel essai à la prochaine demande
        console.warn('Fonds du collectif indisponible', err)
        request = null
      })
    return request
  }

  return { fund, visible, load }
})
