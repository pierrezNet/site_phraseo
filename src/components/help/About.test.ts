import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount as baseMount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import type { Component } from 'vue'

// Le résumé du fonds (FundSummary) a besoin de Pinia ; pas de relais : aucun appel réseau
vi.mock('../../utils/relay', () => ({ API_BASE: '' }))
const mount = (c: Component) => baseMount(c, { global: { plugins: [createPinia()] } })

const support = vi.hoisted(() => ({ SUPPORT_URL: '', SUPPORT_DEMO: false }))
vi.mock('../../utils/support', () => support)

describe('À propos : section « Soutenir le projet »', () => {
  beforeEach(() => vi.resetModules())

  it('masquée tant que le collectif n’est pas accepté', async () => {
    support.SUPPORT_URL = ''
    const AboutFr = (await import('./AboutFr.vue')).default
    expect(mount(AboutFr).text()).not.toContain('Soutenir le projet')
  })

  it('affichée avec un lien vers le collectif, en français et en anglais', async () => {
    support.SUPPORT_URL = 'https://opencollective.com/phraseo'
    const AboutFr = (await import('./AboutFr.vue')).default
    const AboutEn = (await import('./AboutEn.vue')).default
    const fr = mount(AboutFr)
    expect(fr.text()).toContain('Soutenir le projet')
    expect(fr.find('a[href="https://opencollective.com/phraseo"]').exists()).toBe(true)
    expect(mount(AboutEn).text()).toContain('Support the project')
  })
})
