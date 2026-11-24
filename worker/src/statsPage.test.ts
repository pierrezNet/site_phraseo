import { describe, it, expect } from 'vitest'
import { statsPage, workersAiNeurons } from './statsPage'

const limits = { user: 4000, ip: 6000, global: 8000 }
const now = new Date('2026-11-24T10:30:00Z')

describe('page « Consommation voix »', () => {
  const data = {
    today: { global: 2000, users: 3 },
    limits,
    days: [
      { day: '2026-11-24', metrics: { users: 3, tts_fr_lines: 12, tts_fr_chars: 1000, tts_en_lines: 4, tts_en_chars: 400, tts_cache: 9, stt_count: 5, stt_seconds: 30, units: 2000 } },
      { day: '2026-11-23', metrics: { users: 2, tts_fr_lines: 5, tts_fr_chars: 600, units: 300 } },
      { day: '2026-10-31', metrics: { tts_fr_chars: 99_999 } },
    ],
  }

  it('totaux du jour : personnes, répliques, cache, transcriptions', () => {
    const html = statsPage(data, now)
    expect(html).toContain('<div class="card-value">3</div>')
    expect(html).toContain('<div class="card-value">16</div>')
    expect(html).toContain('12 en français · 4 en anglais')
    expect(html).toContain('<div class="card-value">9</div>')
  })

  it('quotas : global du jour, Workers AI estimé, Azure sur le mois en cours seulement', () => {
    const html = statsPage(data, now).replace(/ /g, ' ')
    expect(html).toContain('2 000 / 8 000 unités · 25 %')
    expect(html).toContain('1 600 / 500 000 caractères gratuits')
  })

  it('neurones Workers AI : anglais au caractère et transcription à la minute', () => {
    expect(workersAiNeurons({ tts_en_chars: 1100, stt_seconds: 60 })).toBeCloseTo(1500 + 45.5)
  })

  it('sans données : page lisible', () => {
    expect(statsPage({ today: { global: 0, users: 0 }, limits, days: [] }, now)).toContain('Aucune donnée pour le moment.')
  })
})
