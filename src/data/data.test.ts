import { describe, it, expect } from 'vitest'
import vfr from './phraseologieVFR.json'
import ifr from './phraseologieIFR.json'
import scenarios from './scenarios.json'
import { migrateLegacyFields } from '../stores/form'

/** Tags connus de replacePlaceholders (cas particuliers) ; les autres sont des champs du formulaire */
const SPECIAL = ['POL', 'HOU', 'HDIFF', 'HDIFF5M', 'HDIFF10P', 'CAA', 'RWY', 'RWYA', 'RWYO', 'QNH', 'MET', 'SEL',
  'DEL', 'GND', 'TWR', 'APP', 'CTR', 'NSTA', 'NDEL', 'NGND', 'NTWR', 'NAPP', 'NCTR']
const FORM = ['ALT', 'SORTIE', 'TTWR', 'FIR', 'DEP', 'POS', 'POSA', 'ARR', 'COM', 'CAL', 'INF', 'WPT', 'SID', 'STAR',
  'VOI', 'VOIA', 'HLD', 'SQU', 'NIV', 'NIVC', 'VIT', 'CAP', 'SORTIE']

const tagsOf = (data: unknown): Set<string> => new Set([...JSON.stringify(data).matchAll(/\[([A-Z0-9]+)\]/g)].map((m) => m[1]))

describe('données de phraséologie', () => {
  it('tous les tags utilisés sont connus (aucun ancien [STA])', () => {
    for (const data of [vfr, ifr, scenarios]) {
      const unknown = [...tagsOf(data)].filter((t) => !SPECIAL.includes(t) && !FORM.includes(t))
      expect(unknown).toEqual([])
    }
  })
})

describe('migrateLegacyFields', () => {
  it('l’ancien STA devient le SID, sans écraser un SID existant', () => {
    const old: Record<string, unknown> = { STA: 'Bubli_3_Papa', NIV: '110' }
    migrateLegacyFields(old)
    expect(old).toEqual({ SID: 'Bubli_3_Papa', NIV: '110' })
    const both: Record<string, unknown> = { STA: 'X', SID: 'MIRGU 7H' }
    migrateLegacyFields(both)
    expect(both).toEqual({ SID: 'MIRGU 7H' })
  })
})
