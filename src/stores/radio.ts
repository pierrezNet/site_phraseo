import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE } from '../utils/relay'
import { fetchWithTimeout } from '../utils/api'
import { voiceUserId, VoiceQuotaError, type QuotaScope } from '../utils/atcAudio'
import { toWav } from '../utils/wav'
import { useVoiceStore, quotaMessage } from './voice'

/** Une réponse radio tient en 15 s (coupure automatique, comme le relais) */
export const MAX_TALK_MS = 15000
/** En dessous, rien n'a été dit (appui accidentel) */
const MIN_TALK_MS = 300
/** Micro gardé ouvert entre deux réponses : sur mobile, l'ouvrir à chaque appui coupe le début du message */
const MIC_IDLE_MS = 60000

/** Petit « clic » d'alternat : bruit bref et filtré, sans fichier audio */
function radioClick() {
  try {
    const context = new AudioContext()
    const length = Math.round(context.sampleRate * 0.04)
    const buffer = context.createBuffer(1, length, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) * 0.3
    const source = new AudioBufferSourceNode(context, { buffer })
    source.connect(new BiquadFilterNode(context, { type: 'bandpass', frequency: 1800 })).connect(context.destination)
    source.onended = () => context.close()
    source.start()
  } catch {
    // pas d'audio disponible : l'alternat fonctionne sans le clic
  }
}

async function transcribe(wav: Blob, lang: 'fr' | 'en', hint: string[]): Promise<{ text: string; left: number | null }> {
  const res = await fetchWithTimeout(`${API_BASE}/stt?lang=${lang}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'audio/wav',
      'X-Phraseo-User': voiceUserId(),
      'X-Stt-Hint': encodeURIComponent(hint.join(', ')),
    },
    body: wav,
    timeout: 20000,
  })
  if (res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as { quota?: QuotaScope }
    if (body.quota) throw new VoiceQuotaError(body.quota)
  }
  if (!res.ok) throw new Error(`Reconnaissance vocale : HTTP ${res.status}`)
  const left = Number(res.headers.get('X-Voice-Quota-Left'))
  const { text } = (await res.json()) as { text: string }
  return { text, left: res.headers.has('X-Voice-Quota-Left') && Number.isFinite(left) ? left : null }
}

/**
 * Alternat du pilote (quiz) : maintenir pour parler, relâcher pour transcrire (Whisper via le relais).
 * `talk` démarre l'émission pour une réplique, `release` l'arrête et renvoie le texte entendu.
 */
export const useRadioStore = defineStore('radio', () => {
  const available = !!API_BASE && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  /** Réplique en émission / en cours de transcription */
  const recording = ref<string | null>(null)
  /** Micro prêt et enregistrement lancé : on peut parler (avant, le micro s'ouvre encore) */
  const live = ref(false)
  const transcribing = ref<string | null>(null)
  const error = ref('')
  /** Accès au micro refusé : la saisie au clavier redevient le seul moyen de répondre */
  const micDenied = ref(false)

  let stream: MediaStream | null = null
  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function closeMic() {
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
  }

  async function openMic(): Promise<MediaStream> {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = null
    if (stream?.getAudioTracks().some((t) => t.readyState === 'live')) return stream
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    })
    return stream
  }

  let recorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let startedAt = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  /** Résultat de l'émission en cours, attendu par `release` */
  let stopped: Promise<Blob | null> | null = null
  /** Arrêt automatique à 15 s : la transcription part comme si l'on avait relâché */
  let onAutoStop: (() => void) | null = null

  async function talk(key: string, autoStop?: () => void) {
    if (!available || recording.value || transcribing.value) return
    error.value = ''
    recording.value = key
    onAutoStop = autoStop ?? null
    try {
      const mic = await openMic()
      // Relâché pendant l'ouverture du micro (ou la demande d'autorisation) : on n'enregistre pas
      if (recording.value !== key) return
      chunks = []
      // Débit élevé : moins d'artefacts de compression pour la reconnaissance
      recorder = new MediaRecorder(mic, { audioBitsPerSecond: 128000 })
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      stopped = new Promise((resolve) => {
        recorder!.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: recorder!.mimeType }) : null)
      })
      radioClick()
      recorder.start()
      startedAt = Date.now()
      live.value = true
      timer = setTimeout(() => onAutoStop?.(), MAX_TALK_MS)
    } catch (e) {
      console.error(e)
      recording.value = null
      micDenied.value = e instanceof DOMException && e.name === 'NotAllowedError'
      error.value = 'Micro inaccessible : autorisez le micro pour ce site, ou tapez votre réponse.'
    }
  }

  /** Fin d'émission : texte entendu, ou null (trop court, erreur, quota) avec `error` renseigné */
  async function release(lang: 'fr' | 'en', hint: string[]): Promise<string | null> {
    const key = recording.value
    if (!key) return null
    if (timer) clearTimeout(timer)
    timer = null
    recording.value = null
    live.value = false
    // Micro libéré après une minute sans nouvelle réponse
    idleTimer = setTimeout(closeMic, MIC_IDLE_MS)
    if (!recorder || recorder.state === 'inactive' || !stopped) {
      // Relâché avant que le micro soit prêt (souvent le premier appui, pendant l'autorisation)
      if (!micDenied.value) error.value = 'Micro en cours d’ouverture : maintenez jusqu’au signal « ● ÉMISSION », puis parlez.'
      return null
    }
    const duration = Date.now() - startedAt
    recorder.stop()
    radioClick()
    const blob = await stopped
    recorder = null
    stopped = null
    if (!blob || duration < MIN_TALK_MS) {
      error.value = 'Maintenez la touche Espace (ou le bouton) pendant que vous parlez.'
      return null
    }

    transcribing.value = key
    const voice = useVoiceStore()
    try {
      const { wav } = await toWav(blob)
      const { text, left } = await transcribe(wav, lang, hint)
      if (left !== null) voice.quotaLeft = left
      if (!text) {
        error.value = 'Rien entendu : réessayez en parlant plus près du micro.'
        return null
      }
      return text
    } catch (e) {
      if (e instanceof VoiceQuotaError) {
        voice.quotaReached()
        error.value = quotaMessage(e.scope)
      } else {
        console.error(e)
        error.value = 'Reconnaissance vocale indisponible pour le moment : tapez votre réponse.'
      }
      return null
    } finally {
      transcribing.value = null
    }
  }

  /** Fin du quiz (changement de page) : micro fermé tout de suite */
  function dispose() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = null
    if (!recording.value) closeMic()
  }

  return { available, recording, live, transcribing, error, micDenied, talk, release, dispose }
})
