import { describe, it, expect } from 'vitest'
import { buildFlight, isTaskVisibleAtLevel, requirementsMet, scenarioName, FLIGHT_PHASES, type Scenario } from './flight'
import scenarios from '../data/scenarios.json'
import phraseoVFR from '../data/phraseologieVFR.json'
import phraseoIFR from '../data/phraseologieIFR.json'

const line = (cls: string, text: string) => ({ _class: cls, _lang: 'fr', __text: text })

const data = {
  processChain: {
    tasks: {
      compoundTask: { call: [{ _refid: 'A', _tab: 'SO' }, { _refid: 'B', _tab: 'DE' }, { _refid: 'C', _tab: 'CR' }] },
      spawnTask: [
        { _id: 'A', _name: 'Étape A', para: [line('Pilot', 'a')] },
        { _id: 'B', _name: 'Étape B', para: [] },
        { _id: 'C', _name: 'Imprévu C', _level: 'intermédiaire', para: [line('ATC', 'c')] },
        { _id: 'V1', _name: 'Variante 1', _level: 'débutant', _levelExact: true, para: [line('ATC', 'v1')] },
        { _id: 'V2', _name: 'Variante 2', _level: 'intermédiaire', para: [line('ATC', 'v2')] },
      ],
    },
  },
}

const scenario: Scenario = {
  id: 'T',
  mode: 'IFR',
  name: 'Test',
  steps: [{ task: 'A' }, { task: 'B', then: ['V1', 'V2'] }, { task: 'C', chance: 0.5 }],
}

describe('scenarioName', () => {
  it('remplace départ et arrivée par les paramètres du vol', () => {
    expect(scenarioName('[DEP] → [ARR]', { DEP: 'Orly', ARR: 'Lyon Saint-Exupéry' })).toBe('Orly → Lyon Saint-Exupéry')
  })
  it('laisse le tag si la valeur est vide', () => {
    expect(scenarioName('Tours de piste à [DEP]', { DEP: ' ' })).toBe('Tours de piste à [DEP]')
  })
})

describe('requirementsMet', () => {
  const groundClosed = (f: string) => f !== 'GND'
  it('sans _requires, toujours présent', () => {
    expect(requirementsMet({}, groundClosed)).toBe(true)
  })
  it('absent si une station requise est fermée', () => {
    expect(requirementsMet({ _requires: ['GND'] }, groundClosed)).toBe(false)
    expect(requirementsMet({ _requires: ['TWR'] }, groundClosed)).toBe(true)
  })
})

describe('isTaskVisibleAtLevel', () => {
  it('niveaux cumulatifs', () => {
    expect(isTaskVisibleAtLevel({ _level: 'débutant' }, 'avancé')).toBe(true)
    expect(isTaskVisibleAtLevel({ _level: 'avancé' }, 'intermédiaire')).toBe(false)
    expect(isTaskVisibleAtLevel({}, 'débutant')).toBe(true)
  })
  it('_levelExact limite au seul niveau', () => {
    expect(isTaskVisibleAtLevel({ _level: 'débutant', _levelExact: true }, 'intermédiaire')).toBe(false)
  })
})

describe('buildFlight', () => {
  it('enchaîne tâche puis variante, avec l\'onglet de la séquence', () => {
    const steps = buildFlight(scenario, data, 'débutant', () => 0)
    expect(steps.map((s) => s.taskIds)).toEqual([['A'], ['B', 'V1']])
    expect(steps[1]).toMatchObject({ tab: 'DE', title: 'Étape B', subtitle: 'Variante 1', incident: false })
  })

  it('tire la variante parmi celles visibles au niveau', () => {
    const steps = buildFlight(scenario, data, 'intermédiaire', () => 0.99)
    expect(steps.find((s) => s.title === 'Étape B')?.taskIds).toEqual(['B', 'V2'])
  })

  it('un imprévu n\'a lieu que si le tirage est sous sa chance', () => {
    expect(buildFlight(scenario, data, 'intermédiaire', () => 0.1).some((s) => s.incident)).toBe(true)
    expect(buildFlight(scenario, data, 'intermédiaire', () => 0.9).some((s) => s.incident)).toBe(false)
  })

  it('applique le titre et la phase propres à l\'étape', () => {
    const s: Scenario = { ...scenario, steps: [{ task: 'V2', title: 'Titre scénario', tab: 'SO' }] }
    expect(buildFlight(s, data, 'avancé')[0]).toMatchObject({ title: 'Titre scénario', tab: 'SO' })
  })

  it('donne la consigne de l\'étape, ou celle de la variante tirée', () => {
    const fixed: Scenario = { ...scenario, steps: [{ task: 'A', brief: 'Consigne fixe' }] }
    expect(buildFlight(fixed, data, 'débutant')[0].brief).toBe('Consigne fixe')
    const perVariant: Scenario = { ...scenario, steps: [{ task: 'B', then: ['V1', 'V2'], brief: { V2: 'Consigne V2' } }] }
    expect(buildFlight(perVariant, data, 'intermédiaire', () => 0.99)[0].brief).toBe('Consigne V2')
    expect(buildFlight(perVariant, data, 'débutant', () => 0)[0].brief).toBe('')
  })

  it('saute une étape dont une fréquence requise est fermée', () => {
    const s: Scenario = { ...scenario, steps: [{ task: 'A', requires: ['GND'] }] }
    expect(buildFlight(s, data, 'débutant', () => 0, (f) => f !== 'GND')).toEqual([])
    expect(buildFlight(s, data, 'débutant', () => 0, () => true)).toHaveLength(1)
  })

  it('reporte l\'évaluation souple de l\'étape', () => {
    const s: Scenario = { ...scenario, steps: [{ task: 'A', lenient: true }, { task: 'B', then: ['V1'] }] }
    expect(buildFlight(s, data, 'débutant').map((st) => st.lenient)).toEqual([true, false])
  })

  it('écarte une tâche ou une variante dont la station requise est fermée', () => {
    const d = structuredClone(data)
    const v1 = d.processChain.tasks.spawnTask.find((t) => t._id === 'V1') as { _requires?: string[] }
    v1._requires = ['GND']
    const s: Scenario = { ...scenario, steps: [{ task: 'B', then: ['V1'] }] }
    expect(buildFlight(s, d, 'débutant', () => 0, (f) => f !== 'GND')).toEqual([])
    expect(buildFlight(s, d, 'débutant', () => 0, () => true)).toHaveLength(1)
  })

  it('ignore une étape sans texte ni variante visible', () => {
    const s: Scenario = { ...scenario, steps: [{ task: 'B', then: ['V2'] }] }
    expect(buildFlight(s, data, 'débutant')).toEqual([])
  })
})

// ── Intégrité des scénarios livrés ────────────────────────────────────────────

describe('scenarios.json', () => {
  const dataOf = { VFR: phraseoVFR, IFR: phraseoIFR } as const
  const levels = ['débutant', 'intermédiaire', 'avancé']

  for (const sc of scenarios as Scenario[]) {
    const tasks = dataOf[sc.mode].processChain.tasks
    const ids = new Set([...tasks.spawnTask, ...tasks.orTask].map((t: { _id: string }) => t._id))

    it(`${sc.id} : chaque étape appartient à une phase du vol`, () => {
      const steps = buildFlight(sc, dataOf[sc.mode], 'avancé', () => 0)
      expect(steps.filter((s) => !(FLIGHT_PHASES as readonly string[]).includes(s.tab)).map((s) => s.title)).toEqual([])
    })

    it(`${sc.id} : toutes les tâches existent en ${sc.mode}`, () => {
      const missing = sc.steps.flatMap((s) => [s.task, ...(s.then || [])]).filter((id) => !ids.has(id))
      expect(missing).toEqual([])
    })

    for (const level of levels) {
      it(`${sc.id} : vol jouable en ${level}, avec au moins une réplique pilote`, () => {
        const steps = buildFlight(sc, dataOf[sc.mode], level, () => 0)
        expect(steps.length).toBeGreaterThan(3)
        expect(steps.some((s) => s.lines.some((l) => l._class === 'Pilot'))).toBe(true)
      })
    }
  }
})
