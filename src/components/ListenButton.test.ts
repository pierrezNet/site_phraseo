import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ListenButton from './ListenButton.vue'
import { useVoiceStore } from '../stores/voice'

// Relais configuré : la voix est disponible
vi.mock('../utils/relay', () => ({ API_BASE: 'http://relais.test' }))

describe('ListenButton', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  const mountButton = (props: Record<string, unknown>) =>
    mount(ListenButton, {
      global: { plugins: [pinia] },
      props: { lineKey: '0', speech: 'Fox trotte Sierra Tango', isPilot: false, ...props },
    })

  it('est un bouton cliquable sans prop listenable (défaut : écoutable)', async () => {
    const voice = useVoiceStore()
    const play = vi.spyOn(voice, 'play').mockResolvedValue()
    const wrapper = mountButton({})
    const button = wrapper.find('button.listen-btn')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    expect(play).toHaveBeenCalledWith({ key: '0', text: 'Fox trotte Sierra Tango', pilot: false }, 'fr')
  })

  it("reste une simple icône quand l'écoute est désactivée (pilote en quiz avant correction)", () => {
    const wrapper = mountButton({ isPilot: true, listenable: false })
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
