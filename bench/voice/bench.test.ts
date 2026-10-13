import { describe, it, expect } from 'vitest'
import { pickPhrases, readable, type Candidate } from './phrases'
import { encodeWav } from './wav'
import { summarize, wer, markdownReport, type Trial } from './report'
import { vocabulary, properNouns } from './vocabulary'

const cand = (over: Partial<Candidate>): Candidate => ({
  lang: 'fr', mode: 'IFR', scenario: 'S', step: 'Étape', display: 'x', expected: 'x', criticals: [], equivalences: [], ...over,
})

describe('pickPhrases', () => {
  it('sans doublon, riches en critiques d\'abord, VFR et IFR alternés', () => {
    const picked = pickPhrases(
      [
        cand({ expected: 'a', mode: 'IFR' }),
        cand({ expected: 'b', mode: 'IFR', criticals: [{ label: 'QNH', value: '1013' }] }),
        cand({ expected: 'b', mode: 'IFR' }),
        cand({ expected: 'c', mode: 'VFR' }),
        cand({ expected: 'd', lang: 'en' }),
      ],
      { fr: 3, en: 1 }
    )
    expect(picked.map((p) => `${p.id}:${p.expected}`)).toEqual(['fr-01:b', 'fr-02:c', 'fr-03:a', 'en-01:d'])
  })

  it('rend les épellations lisibles', () => {
    expect(readable('Q_N_H 1013, (Airbus 320)')).toBe('Q N H 1013, Airbus 320')
  })
})

describe('encodeWav', () => {
  it('écrit un en-tête WAV PCM 16 bits mono', () => {
    const view = new DataView(encodeWav(new Float32Array([0, 0.5, -1]), 16000))
    const text = (o: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(o + i)))
    expect([text(0), text(8), text(36)]).toEqual(['RIFF', 'WAVE', 'data'])
    expect(view.getUint16(22, true)).toBe(1) // mono
    expect(view.getUint32(24, true)).toBe(16000)
    expect(view.getUint32(40, true)).toBe(6) // 3 échantillons × 2 octets
    expect(view.getInt16(48, true)).toBe(-32768)
  })
})

describe('notation du banc', () => {
  const take = {
    id: 'fr-01', lang: 'fr' as const, durationMs: 60000,
    expected: 'Transpondeur 7001, je roule point d\'attente piste 23, F S T.',
    criticals: [{ label: 'Transpondeur', value: '7001' }, { label: 'Piste', value: '23' }],
    equivalences: [['F S T', 'F-EPST']],
  }
  const trials: Trial[] = [
    { engine: 'reference', take, transcript: take.expected, latencyMs: 0 },
    { engine: 'moteur', take, transcript: 'transpondeur 7010 je roule point d\'attente piste 23 F S T', latencyMs: 800 },
  ]

  it('le moteur de référence obtient 100 %', () => {
    expect(summarize(trials, 'reference', 'tous')).toMatchObject({ criticalAccuracy: 1, passRate: 1, wer: 0 })
  })

  it('un transpondeur mal reconnu fait échouer la phrase', () => {
    expect(summarize(trials, 'moteur', 'fr')).toMatchObject({ criticalAccuracy: 0.5, passRate: 0 })
  })

  it('WER sur les mots normalisés', () => {
    expect(wer('piste 23', 'piste 23')).toBe(0)
    expect(wer('piste 23', 'piste 24')).toBe(0.5)
  })

  it('le rapport cite les éléments critiques manqués', () => {
    const md = markdownReport(trials, [{ id: 'moteur', label: 'Moteur', costPerMinute: 0.01 }])
    expect(md).toContain('Transpondeur « 7001 »')
    expect(md).toContain('0.010 $')
  })
})

describe('vocabulary', () => {
  it('garde les noms propres, jamais les nombres', () => {
    expect(properNouns(['Direct BUBLI, je monte niveau 110, Air Europe 01.'])).toEqual(['Direct', 'BUBLI', 'Air', 'Europe'])
    expect(vocabulary('en')).toContain('niner')
  })
})
