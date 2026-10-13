import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE } from '../utils/relay'
import { fetchAtcAudio, playRadio, stopRadio } from '../utils/atcAudio'

const STORAGE_KEY = 'atcVoice'

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
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

  // Chaque lecture invalide la précédente : une séquence interrompue ne reprend pas
  let generation = 0

  async function playAll(lines: SpokenLine[], lang: 'fr' | 'en') {
    if (!available || !lines.length) return
    const mine = ++generation
    stopRadio()
    error.value = ''
    // Toutes les répliques sont demandées d'emblée : la suivante est prête à la fin de la précédente
    const audios = lines.map((l) => fetchAtcAudio(l.text, lang))
    audios.forEach((a) => a.catch(() => {}))
    try {
      for (const [i, line] of lines.entries()) {
        loading.value = line.key
        const mp3 = await audios[i]
        if (mine !== generation) return
        loading.value = null
        playing.value = line.key
        await playRadio(mp3, lang, line.pilot ? 'pilot' : 'atc')
        if (mine !== generation) return
      }
    } catch (e) {
      console.error(e)
      if (mine === generation) error.value = "Voix de l'ATC indisponible pour le moment."
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

  return { available, enabled, loading, playing, error, play, playAll, stop, toggle }
})
