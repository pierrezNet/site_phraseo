import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE } from '../utils/relay'
import { fetchAtcAudio, playRadio, stopRadio, VoiceQuotaError, type QuotaScope } from '../utils/atcAudio'

const STORAGE_KEY = 'atcVoice'

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/** Jour de quota (UTC, comme le relais) */
const utcDay = (now: Date) => now.toISOString().slice(0, 10)

/** Message affiché quand le quota voix du jour est atteint ; le texte reste toujours disponible */
export function quotaMessage(scope: QuotaScope, now = new Date()): string {
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const at = reset.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return scope === 'global'
    ? `Quota voix de l'application atteint pour aujourd'hui : la voix revient à ${at}. Les textes restent disponibles.`
    : `Quota voix du jour atteint : il se renouvelle à ${at}. Les textes restent disponibles.`
}

export interface SpokenLine {
  key: string
  /** Texte préparé pour la synthèse (src/utils/speech.ts) */
  text: string
  /** Réplique du pilote : voix plus grave et radio de bord */
  pilot?: boolean
}

/**
 * Voix des répliques : ATC et pilote (icône de la réplique, Espace, et ATC automatique en vol complet si activée).
 * Indisponible sans relais (VITE_API_BASE).
 */
export const useVoiceStore = defineStore('voice', () => {
  const available = !!API_BASE
  /** Lecture automatique en vol complet */
  const enabled = ref(readEnabled())
  /** Réplique en cours de chargement / de lecture */
  const loading = ref<string | null>(null)
  const playing = ref<string | null>(null)
  const error = ref('')
  /** Part du quota voix restante aujourd'hui (0–1), connue après la première synthèse */
  const quotaLeft = ref<number | null>(null)
  /** Quota atteint : la lecture automatique s'arrête jusqu'au lendemain (UTC) */
  const quotaBlockedDay = ref<string | null>(null)
  const quotaBlocked = () => quotaBlockedDay.value === utcDay(new Date())

  /** Quota du jour atteint (voix ou reconnaissance) : plus de voix automatique ni de réponse vocale imposée */
  function quotaReached() {
    quotaLeft.value = 0
    quotaBlockedDay.value = utcDay(new Date())
  }

  // Chaque lecture invalide la précédente : une séquence interrompue ne reprend pas
  let generation = 0

  async function playAll(lines: SpokenLine[], lang: 'fr' | 'en') {
    if (!available || !lines.length) return
    const mine = ++generation
    stopRadio()
    error.value = ''
    // Toutes les répliques sont demandées d'emblée : la suivante est prête à la fin de la précédente
    const audios = lines.map((l) => fetchAtcAudio(l.text, lang, (left) => (quotaLeft.value = left)))
    audios.forEach((a) => a.catch(() => {}))
    try {
      for (const [i, line] of lines.entries()) {
        loading.value = line.key
        const wav = await audios[i]
        if (mine !== generation) return
        loading.value = null
        playing.value = line.key
        await playRadio(wav, lang, line.pilot ? 'pilot' : 'atc')
        if (mine !== generation) return
      }
    } catch (e) {
      if (mine !== generation) return
      if (e instanceof VoiceQuotaError) {
        quotaReached()
        error.value = quotaMessage(e.scope)
      } else {
        console.error(e)
        error.value = 'Voix indisponible pour le moment.'
      }
    } finally {
      if (mine === generation) {
        loading.value = null
        playing.value = null
      }
    }
  }

  const play = (line: SpokenLine, lang: 'fr' | 'en') => playAll([line], lang)

  function stop() {
    generation++
    stopRadio()
    loading.value = null
    playing.value = null
  }

  function toggle() {
    enabled.value = !enabled.value
    try {
      localStorage.setItem(STORAGE_KEY, enabled.value ? 'on' : 'off')
    } catch {
      // stockage indisponible (navigation privée) : réglage gardé pour la session
    }
    if (!enabled.value) stop()
  }

  return { available, enabled, loading, playing, error, quotaLeft, quotaBlocked, quotaReached, play, playAll, stop, toggle }
})
