import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskTextDisplay from './TaskTextDisplay.vue'
import { useQuizStore } from '../stores/quiz'
import { useWeatherStore } from '../stores/weather'
import { useFormStore } from '../stores/form'
import { useRadioStore } from '../stores/radio'

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
    expect(wrapper.text()).toContain('AEL001')
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

  it('mode quiz : affiche une saisie pour le pilote et garde les lignes ATC (tâche PARAMETRES)', () => {
    const quiz = useQuizStore()
    quiz.enabled = true
    const tasks = [
      { __text: '[CAA], Demande paramètres pour le départ.', _lang: 'fr', _class: 'Pilot' },
      { __text: '[CAA], piste [RWY], niveau de transition (6_0).', _lang: 'fr', _class: 'ATC' },
      { __text: 'Piste [RWY], Q_N_H [QNH], [CAA].', _lang: 'fr', _class: 'Pilot' },
    ]
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: tasks },
    })
    // 3 blocs affichés (2 saisies pilote + 1 ATC), pas d'écran vide
    expect(wrapper.findAll('.rounded-md')).toHaveLength(3)
    expect(wrapper.findAll('textarea')).toHaveLength(2)
    expect(wrapper.text()).toContain('À vous')
  })

  it('mode quiz : « Réessayer » seulement après une réponse refusée', async () => {
    useQuizStore().enabled = true
    const caa = useFormStore().form.CAA
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Rappellerai prêt, [CAA].', 'fr', 'Pilot') },
    })
    const answer = async (text: string) => {
      await wrapper.find('textarea').setValue(text)
      await wrapper.findAll('button').find((b) => b.text() === 'Vérifier')!.trigger('click')
    }
    const hasRetry = () => wrapper.findAll('button').some((b) => b.text() === 'Réessayer')

    await answer('roger')
    expect(wrapper.text()).toContain('À revoir')
    expect(hasRetry()).toBe(true)

    await wrapper.findAll('button').find((b) => b.text() === 'Réessayer')!.trigger('click')
    await answer(`Rappellerai prêt, ${caa}.`)
    expect(wrapper.text()).toContain('Validé')
    expect(hasRetry()).toBe(false)
  })

  it('affiche une tâche avec [QNH] même si le METAR renvoie un altimètre numérique', () => {
    // Régression : altimeter.value en nombre (METAR) faisait planter buildCriticals
    const weather = useWeatherStore()
    weather.metarData = { altimeter: { value: 1013 } }
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Piste [RWY], Q_N_H [QNH], [CAA].', 'fr', 'Pilot') },
    })
    // Le panneau ne doit pas être vide
    expect(wrapper.findAll('.rounded-md')).toHaveLength(1)
    expect(wrapper.text()).toContain('1013')
  })

  it('alternat : au relâchement d’Espace, le texte entendu est noté et affiché « Entendu : »', async () => {
    useQuizStore().enabled = true
    const caa = useFormStore().form.CAA
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Rappellerai prêt, [CAA].', 'fr', 'Pilot') },
      attachTo: document.body,
    })
    const radio = useRadioStore()
    const release = vi.spyOn(radio, 'release').mockResolvedValue(`Rappellerai prêt, ${caa}.`)
    // Émission en cours sur la réplique 0 (le micro n'existe pas sous jsdom)
    radio.recording = '0'
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }))
    await vi.waitFor(() => expect(wrapper.text()).toContain('Validé'))
    expect(release).toHaveBeenCalledWith('fr', expect.arrayContaining(['Alpha', 'Tour']))
    expect(wrapper.text()).toContain('Entendu :')
    wrapper.unmount()
  })

  it('alternat : Espace parle depuis une zone de réponse vide, écrit dès qu’elle contient du texte', async () => {
    useQuizStore().enabled = true
    const wrapper = mount(TaskTextDisplay, {
      global: { plugins: [pinia] },
      props: { selectedTaskTexts: makeTasks('Rappellerai prêt, [CAA].', 'fr', 'Pilot') },
      attachTo: document.body,
    })
    const radio = useRadioStore()
    // Micro présent (absent sous jsdom) : l'émission démarre
    ;(radio as unknown as { available: boolean }).available = true
    const talk = vi.spyOn(radio, 'talk').mockResolvedValue()
    const field = wrapper.find('textarea')
    const space = () => {
      const e = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true, cancelable: true })
      field.element.dispatchEvent(e)
      return e
    }

    expect(space().defaultPrevented).toBe(true)
    expect(talk).toHaveBeenCalledWith('0', expect.any(Function))

    talk.mockClear()
    await field.setValue('Rappellerai')
    expect(space().defaultPrevented).toBe(false)
    expect(talk).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  describe('mobile (écran tactile)', () => {
    const touch = vi.fn(() => ({ matches: true }))
    beforeEach(() => vi.stubGlobal('matchMedia', touch))
    afterEach(() => vi.unstubAllGlobals())

    const mountMobile = () => {
      useQuizStore().enabled = true
      const radio = useRadioStore()
      ;(radio as unknown as { available: boolean }).available = true
      const wrapper = mount(TaskTextDisplay, {
        global: { plugins: [pinia] },
        props: { selectedTaskTexts: makeTasks('Rappellerai prêt, [CAA].', 'fr', 'Pilot') },
      })
      return { wrapper, radio }
    }

    it('réponse à la voix uniquement : ni clavier ni « Vérifier », un grand bouton sans mention d’Espace', () => {
      const { wrapper } = mountMobile()
      expect(wrapper.find('textarea').exists()).toBe(false)
      expect(wrapper.findAll('button').some((b) => b.text() === 'Vérifier')).toBe(false)
      expect(wrapper.text()).toContain('🎙 Maintenir pour parler')
      expect(wrapper.text()).not.toContain('(Espace)')
    })

    it('micro refusé : retour à la saisie au clavier', async () => {
      const { wrapper, radio } = mountMobile()
      radio.micDenied = true
      await wrapper.vm.$nextTick()
      expect(wrapper.find('textarea').exists()).toBe(true)
    })
  })
})
