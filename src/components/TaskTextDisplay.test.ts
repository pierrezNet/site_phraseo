import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskTextDisplay from './TaskTextDisplay.vue'

const makeTasks = (text: string, lang = 'fr', cls = 'ATC') => [
  { __text: text, _lang: lang, _class: cls, icon: null },
]

describe('TaskTextDisplay', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('affiche un bloc par élément correspondant à la langue active', () => {
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Bonjour [CAA]') },
    })
    const blocks = wrapper.findAll('.rounded-md')
    expect(blocks).toHaveLength(1)
  })

  it('filtre les éléments dont la langue ne correspond pas', () => {
    const tasks = [
      { __text: 'Texte français', _lang: 'fr', _class: 'ATC', icon: null },
      { __text: 'English text', _lang: 'en', _class: 'Pilot', icon: null },
    ]
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: tasks },
    })
    // langStore par défaut → 'fr' : seul le texte français s'affiche
    const blocks = wrapper.findAll('.rounded-md')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].text()).toContain('Texte français')
  })

  it('applique la classe blue pour les éléments Pilot', () => {
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Roger', 'fr', 'Pilot') },
    })
    const block = wrapper.find('.rounded-md')
    expect(block.classes()).toContain('border-blue-500')
  })

  it('applique la classe orange pour les éléments ATC', () => {
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Cleared', 'fr', 'ATC') },
    })
    const block = wrapper.find('.rounded-md')
    expect(block.classes()).toContain('border-orange-500')
  })

  it('remplace [CAA] par la valeur par défaut du formStore', () => {
    // formStore default : CAA = 'Air Europe 01'
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Station [CAA]') },
    })
    expect(wrapper.text()).toContain('Air Europe 01')
  })

  it('se met à jour quand la prop selectedTaskTexts change', async () => {
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Premier message') },
    })
    await wrapper.setProps({ selectedTaskTexts: makeTasks('Deuxième message') })
    expect(wrapper.text()).toContain('Deuxième message')
    expect(wrapper.text()).not.toContain('Premier message')
  })

  it('affiche rien si selectedTaskTexts est vide', () => {
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: [] },
    })
    expect(wrapper.findAll('.rounded-md')).toHaveLength(0)
  })
})
