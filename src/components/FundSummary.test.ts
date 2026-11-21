import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../utils/relay', () => ({ API_BASE: 'http://relais.test' }))
const support = vi.hoisted(() => ({ SUPPORT_URL: 'https://opencollective.com/phraseo', SUPPORT_DEMO: false }))
vi.mock('../utils/support', () => support)

const fund = (active: boolean) => ({
  active,
  currency: 'EUR',
  balance: 7500,
  received: 12000,
  spent: 4500,
  expenseCount: 1,
  expenses: [{ description: 'Microsoft Azure — voix françaises', date: '2026-12-05', amount: 420 }],
})

describe('FundSummary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
  })

  const mountWith = async (data: unknown) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 })))
    const FundSummary = (await import('./FundSummary.vue')).default
    const wrapper = mount(FundSummary)
    await flushPromises()
    vi.unstubAllGlobals()
    return wrapper
  }

  it('collectif actif : montants, dernières dépenses et lien vers le budget', async () => {
    const text = (await mountWith(fund(true))).text().replace(/\s/g, ' ')
    expect(text).toMatch(/Reçu\s*120,00 €/)
    expect(text).toMatch(/Dépensé\s*45,00 €/)
    expect(text).toMatch(/Solde\s*75,00 €/)
    expect(text).toContain('Microsoft Azure — voix françaises')
    expect(text).toMatch(/4,20 €/)
    expect(text).toContain('Tout le budget')
  })

  it('collectif pas encore accepté : rien d’affiché', async () => {
    expect((await mountWith(fund(false))).text()).toBe('')
  })
})
