import { describe, it, expect } from 'vitest'
import {
  TTS_MAX_CHARS,
  checkSttAudio,
  sttNeurons,
  sttPrompt,
  discordPayload,
  parseFeedback,
  parseTts,
  quotaDay,
  quotaLimits,
  quotaVerdict,
  toMetar,
  ttsAudioBytes,
  ttsCacheKey,
  ttsNeurons,
  visibilityMeters,
  wavSeconds,
} from './relay'

// ── METAR NOAA → format front ─────────────────────────────────────────────────

describe('toMetar', () => {
  const noaa = {
    icaoId: 'LFPG',
    rawOb: 'METAR LFPG 270700Z 17003KT 140V200 6000 NSC 15/13 Q1018 NOSIG',
    temp: 15,
    wdir: 170,
    wspd: 3,
    visib: 3.73,
    altim: 1018,
  }

  it('convertit la réponse NOAA', () => {
    expect(toMetar(noaa)).toEqual({
      station: 'LFPG',
      raw: noaa.rawOb,
      altimeter: { value: 1018 },
      temperature: { value: 15 },
      wind_direction: { value: 170 },
      wind_speed: { value: 3 },
      visibility: { value: 6000 },
    })
  })

  it('traite le vent variable comme une direction absente', () => {
    expect(toMetar({ ...noaa, wdir: 'VRB' }).wind_direction.value).toBeNull()
  })

  it('arrondit le QNH', () => {
    expect(toMetar({ ...noaa, altim: 1017.6 }).altimeter.value).toBe(1018)
  })
})

describe('visibilityMeters', () => {
  it('convertit les miles en mètres arrondis à la centaine', () => {
    expect(visibilityMeters(3.73)).toBe(6000)
  })
  it('renvoie 9999 pour "10+" et plafonne à 9999', () => {
    expect(visibilityMeters('10+')).toBe(9999)
    expect(visibilityMeters(10)).toBe(9999)
  })
  it('renvoie null si absente ou illisible', () => {
    expect(visibilityMeters(null)).toBeNull()
    expect(visibilityMeters('abc')).toBeNull()
  })
})

// ── Feedback ──────────────────────────────────────────────────────────────────

describe('parseFeedback', () => {
  const valid = {
    type: 'Bug technique',
    message: '  Le QNH ne se met pas à jour  ',
    contact: 'pilote@example.org',
    mode: 'VFR',
    level: 'débutant',
    lang: 'fr',
  }

  it('accepte et nettoie un retour valide', () => {
    expect(parseFeedback(valid)).toEqual({ ...valid, message: 'Le QNH ne se met pas à jour' })
  })

  it('refuse un type inconnu', () => {
    expect(parseFeedback({ ...valid, type: 'Spam' })).toBeNull()
  })

  it('refuse un message vide ou trop long', () => {
    expect(parseFeedback({ ...valid, message: '   ' })).toBeNull()
    expect(parseFeedback({ ...valid, message: 'a'.repeat(1801) })).toBeNull()
  })

  it('refuse un mode ou une langue invalides', () => {
    expect(parseFeedback({ ...valid, mode: 'XYZ' })).toBeNull()
    expect(parseFeedback({ ...valid, lang: 'de' })).toBeNull()
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    expect(parseFeedback(null)).toBeNull()
    expect(parseFeedback('texte')).toBeNull()
  })
})

describe('discordPayload', () => {
  it('désactive toutes les mentions Discord', () => {
    const f = parseFeedback({ type: 'Autre', message: '@everyone test', contact: '', mode: '', level: '', lang: '' })!
    const p = discordPayload(f)
    expect(p.allowed_mentions).toEqual({ parse: [] })
    expect(p.embeds[0].fields.map((x) => x.value)).toEqual(['—', '—', '—', '—'])
  })
})

// ── Synthèse vocale ──────────────────────────────────────────────────────────

describe('parseTts', () => {
  it('accepte un texte et une langue valides, espaces réduits', () => {
    expect(parseTts({ text: ' Foxtrot  Sierra Tango ', lang: 'fr' })).toEqual({ text: 'Foxtrot Sierra Tango', lang: 'fr' })
  })

  it('refuse texte vide, trop long ou langue inconnue', () => {
    expect(parseTts({ text: '', lang: 'fr' })).toBeNull()
    expect(parseTts({ text: 'a'.repeat(TTS_MAX_CHARS + 1), lang: 'fr' })).toBeNull()
    expect(parseTts({ text: 'hello', lang: 'de' })).toBeNull()
    expect(parseTts(null)).toBeNull()
  })
})

describe('ttsCacheKey', () => {
  it('dépend du texte et de la langue', async () => {
    const a = await ttsCacheKey({ text: 'roger', lang: 'fr' })
    expect(a).toBe(await ttsCacheKey({ text: 'roger', lang: 'fr' }))
    expect(a).not.toBe(await ttsCacheKey({ text: 'roger', lang: 'en' }))
  })
})

describe('ttsAudioBytes', () => {
  it('accepte les octets bruts ou le base64', () => {
    const bytes = new Uint8Array([0x49, 0x44, 0x33])
    expect(ttsAudioBytes(bytes)).toBe(bytes)
    expect([...ttsAudioBytes({ audio: 'SUQz' })]).toEqual([0x49, 0x44, 0x33])
  })
})

// ── Quotas voix ──────────────────────────────────────────────────────────────

describe('quotaVerdict', () => {
  const limits = { user: 800, ip: 2400, global: 8000 }

  it('autorise et renvoie la part restante la plus faible', () => {
    expect(quotaVerdict({ user: 200, ip: 200, global: 1000 }, limits)).toEqual({ allowed: true, left: 0.75 })
  })

  it('bloque l’utilisateur, puis l’IP, et le plafond global prime pour tout le monde', () => {
    expect(quotaVerdict({ user: 800, ip: 800, global: 800 }, limits)).toEqual({ allowed: false, scope: 'user', left: 0 })
    expect(quotaVerdict({ user: 10, ip: 2400, global: 2400 }, limits)).toEqual({ allowed: false, scope: 'ip', left: 0 })
    expect(quotaVerdict({ user: 900, ip: 2400, global: 8000 }, limits)).toEqual({ allowed: false, scope: 'global', left: 0 })
  })
})

describe('quotaLimits', () => {
  it('lit les variables, avec repli sur les valeurs par défaut', () => {
    expect(quotaLimits({ QUOTA_USER: '500', QUOTA_IP: 'x' })).toEqual({ user: 500, ip: 2400, global: 8000 })
  })
})

describe('wavSeconds / ttsNeurons', () => {
  // En-tête WAV minimal : 44,1 kHz mono 16 bits → 88 200 octets par seconde
  const wav = (seconds: number) => {
    const bytes = new Uint8Array(44 + 88200 * seconds)
    bytes.set([0x52, 0x49, 0x46, 0x46]) // RIFF
    new DataView(bytes.buffer).setUint32(28, 88200, true)
    return bytes
  }

  it('lit la durée dans l’en-tête', () => {
    expect(wavSeconds(wav(6))).toBe(6)
    expect(wavSeconds(new Uint8Array(100))).toBeNull()
  })

  it('compte 18,6 neurones par minute d’audio, estimation par le texte à défaut', () => {
    expect(ttsNeurons(wav(60), '')).toBeCloseTo(18.6)
    expect(ttsNeurons(new Uint8Array(10), 'x'.repeat(720))).toBeCloseTo(18.6)
  })
})

describe('quotaDay', () => {
  it('jour UTC', () => expect(quotaDay(new Date('2026-10-13T23:30:00-02:00'))).toBe('2026-10-14'))
})

// ── Reconnaissance vocale ────────────────────────────────────────────────────

describe('checkSttAudio', () => {
  // WAV 16 kHz mono 16 bits : 32 000 octets par seconde
  const wav16k = (seconds: number) => {
    const bytes = new Uint8Array(44 + Math.round(32000 * seconds))
    bytes.set([0x52, 0x49, 0x46, 0x46])
    new DataView(bytes.buffer).setUint32(28, 32000, true)
    return bytes
  }

  it('accepte une réponse de quelques secondes', () => {
    expect(checkSttAudio(wav16k(4))).toEqual({ ok: true, seconds: 4 })
  })

  it('refuse trop court, trop long ou pas un WAV', () => {
    expect(checkSttAudio(wav16k(0.1))).toMatchObject({ ok: false, status: 400 })
    expect(checkSttAudio(wav16k(17))).toMatchObject({ ok: false, status: 413 })
    expect(checkSttAudio(new Uint8Array(1000))).toMatchObject({ ok: false, status: 400 })
  })

  it('décompte 45,5 neurones par minute', () => {
    expect(sttNeurons(60)).toBeCloseTo(45.5)
  })
})

describe('sttPrompt', () => {
  it('garde les mots, retire chiffres et caractères inattendus', () => {
    expect(sttPrompt('fr', 'Strasbourg, Tour, 118 décimale 7, <script>')).toBe(
      'Radiotéléphonie aéronautique. Strasbourg, Tour, décimale, script.'
    )
    expect(sttPrompt('en', null)).toBe('Aviation radiotelephony.')
  })
})
