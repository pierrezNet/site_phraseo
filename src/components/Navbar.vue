<template>
  <Disclosure as="nav" class="bg-blue-900 text-white" v-slot="{ open }">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="text-2xl font-bold">Phraséologie IFR</div>
        <!-- Utilise DisclosureButton, pas Disclosure.Button -->
        <DisclosureButton class="md:hidden p-2">
          <span v-if="!open">☰</span>
          <span v-else>✕</span>
        </DisclosureButton>
        <button
          @click="toggleRecording"
          :disabled="isLoading"
          class="p-2 fill-current"
          :aria-label="isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            class="h-8 w-8"
           :class="isRecording 
            ? 'text-red-500 pulse-red'
            : 'text-white'"
          >
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-5 9a1 1 0 0 1-1-1v-2h2v2a1 1 0 0 1-1 1z"/>
          </svg>
        </button>
        <div class="hidden md:flex space-x-4">
          <!-- Affichage du score
          <span v-if="score !== null" class="">Score : {{ score }} %</span> -->
          <a :class="langStore.current==='fr'? 'font-bold':'hover:text-gray-200'" @click.prevent="changeLanguage('fr')">Français</a>
          <a :class="langStore.current==='en'? 'font-bold':'hover:text-gray-200'" @click.prevent="changeLanguage('en')">English</a>
          <a @click="$emit('open-modal','aide')">Aide</a>
          <a @click="$emit('open-modal','parametres')">Paramètres</a>
          <a @click="$emit('open-modal','about')">À propos</a>
        </div>
      </div>
    </div>

    <!-- Utilise DisclosurePanel, pas Disclosure.Panel -->
    <DisclosurePanel class="md:hidden bg-blue-800 space-y-2 px-4 py-2">
      <a :class="langStore.current==='fr'? 'block font-bold':'block hover:text-gray-200'" @click.prevent="changeLanguage('fr')">Français</a>
      <a :class="langStore.current==='en'? 'block font-bold':'block hover:text-gray-200'" @click.prevent="changeLanguage('en')">English</a>
      <a class="block" @click="$emit('open-modal','aide')">Aide</a>
      <a class="block" @click="$emit('open-modal','parametres')">Paramètres</a>
      <a class="block" @click="$emit('open-modal','about')">À propos</a>
    </DisclosurePanel>
  </Disclosure>
</template>

<script setup lang="ts">
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel
} from '@headlessui/vue'
import { useLangStore } from '../stores/lang'
import { useFormStore } from '../stores/form'
import levenshtein from 'fast-levenshtein'
import { ref, inject, onMounted, onBeforeUnmount } from 'vue'
import phraseo from '../assets/phraseologieIFR.json'

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Control' && !isRecording.value) {
    toggleRecording()
  }
}
function onKeyUp(e: KeyboardEvent) {
  if (e.key === 'Control' && isRecording.value) {
    toggleRecording()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

// Initialiser la variable globale pour l'état d'enregistrement
declare global {
  interface Window {
    readbackTimer: number | null;
    isRecordingActive: boolean;
    lastTranscriptTaskId: string | null;
    currentTaskId: string | null; // ID de la tâche actuellement sélectionnée
  }
}

// Initialiser les variables globales au chargement
onMounted(() => {
  window.isRecordingActive = false;
  window.lastTranscriptTaskId = null;
  window.currentTaskId = null;
});

// Définir les événements que ce composant peut émettre
const emit = defineEmits(['open-modal', 'select-task']);

// Définir le type pour le JSON de phraséologie
interface PhraseoTask {
  _id: string;
  _short?: string;
  para?: { _class: string; _lang: string; __text: string }[];
  subgraph?: PhraseoTask[];
}

interface Tasks {
  spawnTask: PhraseoTask[];
  orTask: PhraseoTask[];
  compoundTask: { call: { _refid: string; _tab: string }[] }[];
}

// Traiter phraseo comme un objet de type any pour éviter les erreurs TypeScript
const phraseoAny = phraseo as any;
const tasks = phraseoAny.processChain.tasks as unknown as Tasks;

// Fonction pour vérifier si une réponse ATC nécessite un collationnement
function checkIfNeedsReadback(responseText: string, taskId: string): boolean {
  // Liste des tâches qui nécessitent un collationnement
  const tasksRequiringReadback = [
    "PARAMETRES",           // Informations de départ
    "MER_APPROUVEE",        // Mise en route approuvée
    "MER_OMNI",             // Départ omnidirectionnel
    "ROULAGE_AUTORISE",     // Autorisation de roulage
    "ALIGNEMENT",           // Alignement sur piste
    "DECOL_AUTO",           // Autorisation de décollage
    "NIVEAU",               // Changement de niveau
    "APPROCHE_AUTORISE",    // Approche autorisée
    "ATTERRISSAGE_AUTORISE" // Autorisation d'atterrissage
  ];
  
  return tasksRequiringReadback.includes(taskId);
}

// Fonction pour générer le collationnement approprié
function generateReadback(atcText: string, lang: 'fr' | 'en'): string {
  const formStore = useFormStore();
  const callsign = formStore.form.CAA;

  // Fonction de normalisation simple pour comparer les textes
  const normalize = (t: string) =>
    t
      .toLowerCase()
      .replace(/[.,/#!$%\^&*;:{}=\-_`~()]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

  const normalizedAtc = normalize(atcText);

  // Parcourir toutes les tâches de la phraséologie pour trouver la réponse pilote
  const allTasks = [
    ...(tasks.spawnTask || []),
    ...(tasks.orTask || [])
  ];

  for (const task of allTasks) {
    if (!task.para) continue;
    for (let i = 0; i < task.para.length - 1; i++) {
      const current = task.para[i];
      const next = task.para[i + 1];
      if (
        current._class === 'ATC' &&
        current._lang === lang &&
        next._class === 'Pilot' &&
        next._lang === lang
      ) {
        const replacedAtc = replacePlaceholders(current.__text);
        if (normalize(replacedAtc) === normalizedAtc) {
          return replacePlaceholders(next.__text);
        }
      }
    }
  }

  // Si aucun collationnement spécifique trouvé, utiliser un texte générique
  return lang === 'fr'
    ? `Roger, ${callsign}.`
    : `Roger, ${callsign}.`;
}

// Fonction pour remplacer les placeholders par des valeurs réalistes
function replacePlaceholders(text: string): string {
  const formStore = useFormStore();
  const lang = useLangStore().current; // Garder le type string ici
  if (lang !== 'fr' && lang !== 'en') {
    // Fallback ou gestion d'erreur si la langue n'est pas valide
    console.error("Langue non supportée:", lang);
    return text; // Retourner le texte original ou une erreur
  }
  
  // Obtenir l'heure actuelle pour le placeholder [HOU]
  const now = new Date();
  const currentHour = `${now.getUTCHours().toString().padStart(2, '0')} heures ${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Déterminer le moment de la journée pour [POL]
  const getHeure = (): 'matin' | 'soir' => {
    const dt = new Date();
    return dt.getHours() < 19 ? 'matin' : 'soir';
  };
  
  const POL: Record<'matin' | 'soir', Record<'fr' | 'en', string>> = {
    matin: { fr: "bonjour", en: "hello" },
    soir: { fr: "bonsoir", en: "good evening" }
  };
  
  const replacements: Record<string, string> = {
    '[POL]': POL[getHeure()][lang],
    '[CAA]': formStore.form.CAA,
    '[CAL]': formStore.form.CAL,
    '[RWY]': formStore.formatRunway(formStore.form.RWY, lang),
    '[NIV]': formStore.form.NIV,
    '[STA]': formStore.form.STA,
    '[WPT]': formStore.form.WPT,
    '[DEP]': formStore.form.DEP,
    '[ARR]': formStore.form.ARR,
    '[NDEL]': formStore.frequencyLabels.NDEL ? formStore.frequencyLabels.NDEL[lang] || '' : '',
    '[NGND]': formStore.frequencyLabels.NGND ? formStore.frequencyLabels.NGND[lang] || '' : '',
    '[NTWR]': formStore.frequencyLabels.NTWR ? formStore.frequencyLabels.NTWR[lang] || '' : '',
    '[NAPP]': formStore.frequencyLabels.NAPP ? formStore.frequencyLabels.NAPP[lang] || '' : '',
    '[NCTR]': formStore.frequencyLabels.NCTR ? formStore.frequencyLabels.NCTR[lang] || '' : '',
    '[TWR]': formStore.form.TWR,
    '[APP]': formStore.form.APP,
    '[CTR]': formStore.form.CTR,
    '[GND]': formStore.form.GND,
    '[FIR]': formStore.form.FIR,
    '[MET]': formStore.form.MET,
    '[QNH]': formStore.form.QNH,
    '[SQU]': formStore.form.SQU,
    '[CAP]': formStore.form.CAP,
    '[VOI]': formStore.form.VOI,
    '[HLD]': formStore.form.HLD,
    '[POS]': formStore.form.POS,
    '[VIT]': formStore.form.VIT,
    '[INF]': formStore.form.INF,
    '[HOU]': currentHour
  };
  
  let result = text;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  return result;
}

const langStore = useLangStore();
const formStore = useFormStore();
const changeLanguage = (lang: string) => langStore.changeLanguage(lang)

const isRecording = ref(false)
const isLoading = ref(false)
const score = ref<number|null>(null)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: BlobPart[] = []

// Fonction pour basculer entre démarrage et arrêt de l'enregistrement
async function toggleRecording() {
  if (isRecording.value) {
    await stopRecording();
    
    // Arrêter toute synthèse vocale en cours
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Arrêter tout minuteur en cours
    clearAllTimers();
  } else {
    await startRecording();
  }
}

// Cette déclaration est déjà faite plus haut dans le fichier

// Fonction pour arrêter tous les minuteurs
function clearAllTimers() {
  // Liste des minuteurs à arrêter
  const timers = document.querySelectorAll('[data-timer-id]');
  timers.forEach(timer => {
    const timerId = timer.getAttribute('data-timer-id');
    if (timerId) {
      clearTimeout(parseInt(timerId));
    }
  });
  
  // Arrêter également les minuteurs globaux si nécessaire
  if (window.readbackTimer) {
    clearTimeout(window.readbackTimer);
    window.readbackTimer = null;
  }
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  mediaRecorder = new MediaRecorder(stream)
  audioChunks = []
  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data)
  
  mediaRecorder.start()
  isRecording.value = true
  window.isRecordingActive = true; // Mettre à jour la variable globale
  console.log("Enregistrement démarré, isRecordingActive =", window.isRecordingActive);
  score.value = null
}

async function stopRecording() {
  if (!mediaRecorder) return
  
  // Vérifier si l'enregistrement est déjà arrêté pour éviter les arrêts multiples
  if (!isRecording.value) return
  
  console.log("Arrêt de l'enregistrement");
  isRecording.value = false
  window.isRecordingActive = false; // Mettre à jour la variable globale
  console.log("Enregistrement arrêté, isRecordingActive =", window.isRecordingActive);
  
  try {
    mediaRecorder.stop()
  } catch (e) {
    console.error("Erreur lors de l'arrêt de l'enregistrement:", e);
    // Réinitialiser l'état même en cas d'erreur
    isLoading.value = false;
    return;
  }
  
  mediaRecorder.onstop = async () => {
    isLoading.value = true
    const blob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' })
    const file = new File([blob], 'audio.webm', { type: 'audio/webm;codecs=opus' })
    const form = new FormData()
    form.append('file', file)
    form.append('model', 'whisper-1')
    try {
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}` },
        body: form,
      })
      if (!res.ok) {
        console.error(await res.json())
        return
      }
      const { text: transcript } = await res.json()
      let best = 0
      phraseoAny.processChain.tasks.spawnTask.forEach((task: any) => {
        if (task.para) {
          task.para.forEach((p: any) => {
            if (p._class === 'Pilot' && p.__text) {
              // Remplacer les placeholders par des valeurs réalistes
              const refText = replacePlaceholders(p.__text)
              const dist = levenshtein.get(transcript, refText)
              const sc = Math.round((1 - dist / Math.max(transcript.length, refText.length)) * 100)
              if (sc > best) best = sc
            }
          })
        }
      })
      // Mettre à jour le score dans l'interface
      score.value = best
      console.log(`Score : ${best}%`)
      
      // Trouver la meilleure correspondance parmi les phrases pilote
      const lang = useLangStore().current as 'fr' | 'en';
      let bestMatchTask: PhraseoTask | null = null;
      let bestMatchTaskId = "";
      let bestMatchScore = 0;
      
      // Fonction pour normaliser le texte avant comparaison
      function normalizeText(text: string): string {
        // D'abord supprimer les textes entre accolades (notes, commentaires)
        const textWithoutNotes = text.replace(/\{[^}]*\}/g, "");
        
        return textWithoutNotes
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      }
      
      // Fonction pour calculer un score de similarité plus adapté à la phraséologie
      function calculateSimilarityScore(transcript: string, reference: string): number {
        // Normaliser les deux textes
        const normalizedTranscript = normalizeText(transcript);
        const normalizedReference = normalizeText(reference);
        
        // Calculer la distance de Levenshtein
        const dist = levenshtein.get(normalizedTranscript, normalizedReference);
        
        // Calculer le score en pourcentage (0-100)
        const maxLength = Math.max(normalizedTranscript.length, normalizedReference.length);
        let score = Math.round((1 - dist / maxLength) * 100);
        
        // Bonus pour les mots clés correspondants
        const transcriptWords = normalizedTranscript.split(" ");
        const referenceWords = normalizedReference.split(" ");
        
        // Compter les mots correspondants
        let matchingWords = 0;
        for (const word of transcriptWords) {
          if (word.length > 3 && referenceWords.includes(word)) {
            matchingWords++;
          }
        }
        
        // Ajouter un bonus basé sur le pourcentage de mots clés correspondants
        const keywordBonus = Math.round((matchingWords / referenceWords.length) * 20);
        score = Math.min(100, score + keywordBonus);
        
        return score;
      }
      
      // Récupérer l'onglet actuellement sélectionné
      let currentTabCode = "SO"; // Valeur par défaut
      try {
        const appElement = document.querySelector('#app');
        if (appElement && (appElement as any).__vue__) {
          const tabsRef = (appElement as any).__vue__.$refs.tabsRef;
          if (tabsRef && tabsRef.selectedTab) {
            currentTabCode = tabsRef.selectedTab;
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'onglet courant:", error);
      }
      
      console.log(`Onglet courant: ${currentTabCode}`);
      
      // Filtrer les tâches pour ne considérer que celles de l'onglet actuel
      const tasksInCurrentTab = phraseoAny.processChain.tasks.compoundTask.call
        .filter((call: any) => call._tab === currentTabCode)
        .map((call: any) => call._refid);
      
      console.log(`Tâches dans l'onglet courant: ${tasksInCurrentTab.join(', ')}`);
      
      // Parcourir toutes les tâches pour trouver la meilleure correspondance, mais uniquement parmi celles de l'onglet actuel
      // D'abord les spawnTask
      phraseoAny.processChain.tasks.spawnTask.forEach((task: any) => {
        if (task.para && tasksInCurrentTab.includes(task._id)) {
          task.para.forEach((p: any) => {
            if (p._class === 'Pilot' && p._lang === lang && p.__text) {
              const refText = replacePlaceholders(p.__text);
              const sc = calculateSimilarityScore(transcript, refText);
              
              console.log(`Comparaison avec ${task._id}: ${sc}%`);
              console.log(`  Référence: "${refText}"`);
              
              if (sc > bestMatchScore) {
                bestMatchScore = sc;
                bestMatchTask = task;
                bestMatchTaskId = task._id;
              }
            }
          });
        }
      });
      
      // Ensuite les orTask
      phraseoAny.processChain.tasks.orTask.forEach((task: any) => {
        if (task.para && tasksInCurrentTab.includes(task._id)) {
          task.para.forEach((p: any) => {
            if (p._class === 'Pilot' && p._lang === lang && p.__text) {
              const refText = replacePlaceholders(p.__text);
              const sc = calculateSimilarityScore(transcript, refText);
              
              console.log(`Comparaison avec ${task._id}: ${sc}%`);
              console.log(`  Référence: "${refText}"`);
              
              if (sc > bestMatchScore) {
                bestMatchScore = sc;
                bestMatchTask = task;
                bestMatchTaskId = task._id;
              }
            }
          });
        }
      });
      
      // Trouver le nom court de la tâche
      let taskName = bestMatchTaskId;
      
      // Chercher dans les spawnTask
      const spawnTask = phraseoAny.processChain.tasks.spawnTask.find((task: any) => task._id === bestMatchTaskId);
      if (spawnTask && spawnTask._short) {
        taskName = spawnTask._short;
      } else {
        // Chercher dans les orTask
        const orTask = phraseoAny.processChain.tasks.orTask.find((task: any) => task._id === bestMatchTaskId);
        if (orTask && orTask._short) {
          taskName = orTask._short;
        }
      }
      
      console.log(`Meilleure correspondance: ${bestMatchTaskId} avec score ${bestMatchScore}%`);
      console.log(`Transcript: "${transcript}"`);
      
      // Vérifier si le transcript est un collationnement
      let isReadback = false;
      let readbackTaskId = "";
      
      // Fonction pour détecter si un transcript est un collationnement
      function isTranscriptAReadback(transcript: string): { isReadback: boolean, taskId: string } {
        // Mots clés qui indiquent un collationnement
        const readbackKeywords = [
          "je repousse", "repoussage", "je roule", "roulage", 
          "je m'aligne", "alignement", "je décolle", "décollage",
          "je monte", "montée", "je descends", "descente",
          "j'atterris", "atterrissage", "piste", "niveau", "qnh",
          "pushing back", "taxiing", "lining up", "taking off",
          "climbing", "descending", "landing", "runway", "level"
        ];
        
        // Normaliser le transcript
        const normalizedTranscript = normalizeText(transcript);
        
        // Vérifier si le transcript contient des mots clés de collationnement
        let containsReadbackKeyword = false;
        for (const keyword of readbackKeywords) {
          if (normalizedTranscript.includes(normalizeText(keyword))) {
            containsReadbackKeyword = true;
            break;
          }
        }
        
        // Si le transcript ne contient pas de mots clés de collationnement, ce n'est pas un collationnement
        if (!containsReadbackKeyword) {
          return { isReadback: false, taskId: "" };
        }
        
        // Vérifier si le transcript contient l'indicatif d'appel
        const callsign = formStore.form.CAA.toLowerCase();
        const containsCallsign = normalizedTranscript.includes(normalizeText(callsign));
        
        // Si l'indicatif d'appel n'est pas présent, ce n'est probablement pas un collationnement
        if (!containsCallsign) {
          return { isReadback: false, taskId: "" };
        }
        
        // Récupérer l'ID de la tâche actuellement sélectionnée
        const currentTaskId = window.currentTaskId;
        
        // Si aucune tâche n'est sélectionnée, on ne peut pas vérifier le collationnement
        if (!currentTaskId) {
          return { isReadback: false, taskId: "" };
        }
        
        // Trouver la tâche actuellement sélectionnée
        let currentTask = null;
        
        // Chercher dans les spawnTask
        currentTask = phraseoAny.processChain.tasks.spawnTask.find((task: any) => task._id === currentTaskId);
        
        // Si pas trouvé, chercher dans les orTask
        if (!currentTask) {
          currentTask = phraseoAny.processChain.tasks.orTask.find((task: any) => task._id === currentTaskId);
        }
        
        // Si la tâche n'est pas trouvée ou n'a pas de para, ce n'est pas un collationnement
        if (!currentTask || !currentTask.para) {
          return { isReadback: false, taskId: "" };
        }
        
        // Chercher une séquence ATC -> Pilot dans les para de la tâche actuelle
        let pilotReadbackText = null;
        
        for (let i = 0; i < currentTask.para.length - 1; i++) {
          if (currentTask.para[i]._class === 'ATC' && currentTask.para[i]._lang === lang &&
              currentTask.para[i+1]._class === 'Pilot' && currentTask.para[i+1]._lang === lang) {
            
            // C'est une séquence ATC -> Pilot, on a trouvé le collationnement à vérifier
            pilotReadbackText = replacePlaceholders(currentTask.para[i+1].__text);
            break;
          }
        }
        
        // Si aucun collationnement n'est trouvé dans la tâche actuelle, ce n'est pas un collationnement
        if (!pilotReadbackText) {
          return { isReadback: false, taskId: "" };
        }
        
        // Calculer le score de similarité entre le transcript et le collationnement attendu
        const similarityScore = calculateSimilarityScore(transcript, pilotReadbackText);
        
        // Analyse détaillée pour le débogage
        console.log(`Vérification collationnement pour la tâche actuelle ${currentTaskId}: ${similarityScore}%`);
        console.log(`  Référence: "${pilotReadbackText}"`);
        console.log(`  Transcript: "${transcript}"`);
        
        // Analyse des mots clés pour le débogage
        const normalizedTranscriptForDebug = normalizeText(transcript);
        const normalizedReferenceForDebug = normalizeText(pilotReadbackText);
        const transcriptWordsForDebug = normalizedTranscriptForDebug.split(" ");
        const referenceWordsForDebug = normalizedReferenceForDebug.split(" ");
        
        console.log("  Mots du transcript:", transcriptWordsForDebug);
        console.log("  Mots de référence:", referenceWordsForDebug);
        
        // Compter les mots correspondants
        let matchingWords = 0;
        let matchingWordsList = [];
        for (const word of transcriptWordsForDebug) {
          if (word.length > 3 && referenceWordsForDebug.includes(word)) {
            matchingWords++;
            matchingWordsList.push(word);
          }
        }
        
        console.log(`  Mots correspondants (${matchingWords}):`, matchingWordsList);
        
        // Vérifier si l'indicatif d'appel est présent dans le transcript
        const callsignForDebug = formStore.form.CAA.toLowerCase();
        const normalizedCallsignForDebug = normalizeText(callsignForDebug);
        
        // Vérifier les variations phonétiques de l'indicatif d'appel
        // Par exemple, "Air Europe" peut être transcrit comme "R-Europe" ou "Aire Europe"
        let callsignDetected = false;
        let callsignVariation = "";
        
        if (normalizedTranscriptForDebug.includes(normalizedCallsignForDebug)) {
          callsignDetected = true;
          callsignVariation = normalizedCallsignForDebug;
        } else {
          // Vérifier les variations phonétiques courantes
          const callsignParts = normalizedCallsignForDebug.split(" ");
          for (const part of callsignParts) {
            if (part.length > 2) { // Ignorer les parties trop courtes
              // Vérifier si une partie de l'indicatif est présente
              for (const word of transcriptWordsForDebug) {
                // Calculer la distance de Levenshtein entre le mot et la partie de l'indicatif
                const distance = levenshtein.get(word, part);
                // Si la distance est faible (moins de 2 caractères différents), considérer comme une correspondance
                if (distance <= 2) {
                  callsignDetected = true;
                  callsignVariation = word;
                  break;
                }
              }
            }
          }
        }
        
        console.log(`  Indicatif d'appel "${callsignForDebug}" détecté: ${callsignDetected}${callsignVariation ? ` (variation: "${callsignVariation}")` : ""}`);
        
        // Cas spécial pour la tâche PARAMETRES
        if (currentTaskId === "PARAMETRES") {
          // Pour PARAMETRES, on vérifie si le transcript contient "piste" et "qnh"
          const containsPiste = normalizedTranscriptForDebug.includes("piste") || normalizedTranscriptForDebug.includes("runway");
          const containsQNH = normalizedTranscriptForDebug.includes("qnh");
          
          console.log(`  Tâche PARAMETRES - Contient "piste": ${containsPiste}, Contient "qnh": ${containsQNH}`);
          
          // Si le transcript contient "piste" et "qnh", c'est probablement un collationnement pour PARAMETRES
          if (containsPiste && containsQNH && callsignDetected) {
            console.log(`Collationnement PARAMETRES détecté avec "piste", "qnh" et indicatif d'appel`);
            return { isReadback: true, taskId: currentTaskId };
          }
        }
        
        // Pour les autres tâches, on accepte un seuil très bas (20% au lieu de 50%)
        // et on vérifie si l'indicatif d'appel est présent (ou une variation phonétique)
        if ((similarityScore >= 20 && callsignDetected) || similarityScore >= 35) {
          console.log(`Collationnement détecté pour la tâche ${currentTaskId} avec score ${similarityScore}%`);
          return { isReadback: true, taskId: currentTaskId };
        }
        
        return { isReadback: false, taskId: "" };
      }
      
      // Vérifier si le transcript est un collationnement
      const readbackResult = isTranscriptAReadback(transcript);
      isReadback = readbackResult.isReadback;
      readbackTaskId = readbackResult.taskId;
      
      // Créer un événement personnalisé pour informer l'application de la transcription reçue
      const transcriptEvent = new CustomEvent('transcript-received', {
        detail: { 
          transcript, 
          taskId: isReadback ? readbackTaskId : bestMatchTaskId,
          isReadback: isReadback
        }
      });
      window.dispatchEvent(transcriptEvent);
      
      if (isReadback) {
        console.log(`Collationnement détecté pour la tâche: ${readbackTaskId}`);
        // Pour les collationnements, on n'émet pas d'événement select-task
        // car on ne veut pas changer la tâche sélectionnée
      } else if (bestMatchTaskId && bestMatchScore >= 50) { // Seuil de confiance minimum pour les tâches normales
        console.log(`Sélection de la tâche: ${taskName} (${bestMatchTaskId})`);
        
        // Stocker l'ID de la tâche reconnue pour que Tabs.vue puisse l'utiliser
        window.lastTranscriptTaskId = bestMatchTaskId;
        
        // Émettre un événement pour sélectionner la tâche dans l'onglet actuel
        emit('select-task', currentTabCode, bestMatchTaskId);
      } else {
        console.log(`Score trop faible (${bestMatchScore}%) ou tâche non trouvée, aucune action`);
      }
    } catch (e) {
      console.error('Erreur transcription :', e)
    } finally {
      isLoading.value = false
    }
  }
}
</script>
