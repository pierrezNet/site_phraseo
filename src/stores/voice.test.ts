import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { VoiceLangError, VoiceQuotaError } from '../utils/atcAudio'
import { useVoiceStore, quotaMessage } from './voice'

vi.mock('../utils/relay', () => ({ API_BASE: 'http://relais.test' }))
vi.mock('../utils/atcAudio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/atcAudio')>()),
  fetchAtcAudio: vi.fn(),
  playRadio: vi.fn().mockResolvedValue(undefined),
  stopRadio: vi.fn(),
}))

const { fetchAtcAudio } = await import('../utils/atcAudio')

describe('quota voix', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(fetchAtcAudio).mockReset()
  })

  it('retient la part restante annoncée par le relais', async () => {
    vi.mocked(fetchAtcAudio).mockImplementation(async (_t, _l, _speaker, onQuota) => {
      onQuota?.(0.72)
      return new ArrayBuffer(8)
    })
    const voice = useVoiceStore()
    await voice.play({ key: '0', text: 'roger', pilot: true }, 'en')
    expect(fetchAtcAudio).toHaveBeenCalledWith('roger', 'en', 'pilot', expect.any(Function))
    expect(voice.quotaLeft).toBe(0.72)
    expect(voice.quotaBlocked()).toBe(false)
  })

  it('quota atteint : message et lecture automatique suspendue jusqu’au lendemain', async () => {
    vi.mocked(fetchAtcAudio).mockRejectedValue(new VoiceQuotaError('user'))
    const voice = useVoiceStore()
    await voice.play({ key: '0', text: 'roger' }, 'en')
    expect(voice.quotaBlocked()).toBe(true)
    expect(voice.quotaLeft).toBe(0)
    expect(voice.error).toMatch(/^Quota voix du jour atteint/)
  })

  it('voix française refusée par le relais : retirée pour la session, message, plus de demande', async () => {
    vi.mocked(fetchAtcAudio).mockRejectedValue(new VoiceLangError('fr'))
    const voice = useVoiceStore()
    expect(voice.speaks('fr')).toBe(true)
    await voice.play({ key: '0', text: 'roger' }, 'fr')
    expect(voice.speaks('fr')).toBe(false)
    expect(voice.speaks('en')).toBe(true)
    expect(voice.error).toMatch(/^Voix française indisponible/)
    vi.mocked(fetchAtcAudio).mockClear()
    await voice.play({ key: '1', text: 'roger' }, 'fr')
    expect(fetchAtcAudio).not.toHaveBeenCalled()
  })

  it('plafond global : message pour tous', () => {
    expect(quotaMessage('global')).toMatch(/^Quota voix de l'application atteint/)
  })
})
