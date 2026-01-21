<template>
  <Disclosure as="nav" class="bg-blue-900 text-white" v-slot="{ open }">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <div class="flex items-center space-x-3 bg-blue-800/50">
          <span class="text-2xl font-bold">Phraséologie </span>
          <span :class="['font-bold transition-colors', flightMode === 'IFR' ? 'text-white' : 'text-blue-200']">IFR</span>
          
          <label class="relative inline-block w-12 h-6 cursor-pointer">
            <input 
              type="checkbox" 
              class="sr-only peer" 
              :checked="flightMode === 'VFR'"
              @change="toggleFlightMode"
            >
            <div class="w-full h-full bg-gray-500 rounded-full peer transition-colors peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
          </label>

          <span :class="['font-bold transition-colors', flightMode === 'VFR' ? 'text-white' : 'text-blue-400']">VFR</span>
        </div>

        <DisclosureButton class="md:hidden p-2">
          <span v-if="!open" class="text-2xl">☰</span>
          <span v-else class="text-2xl">✕</span>
        </DisclosureButton>

        <div class="hidden md:flex space-x-4 items-center">
          <a :class="langStore.current==='fr'? 'font-bold underline underline-offset-4':'hover:text-gray-200 cursor-pointer'" @click.prevent="changeLanguage('fr')">Français</a>
          <a :class="langStore.current==='en'? 'font-bold underline underline-offset-4':'hover:text-gray-200 cursor-pointer'" @click.prevent="changeLanguage('en')">English</a>
          
          <div class="h-6 w-px bg-blue-700 mx-2"></div>

          <a class="cursor-pointer hover:text-gray-200" @click="$emit('open-modal','aide')">Aide</a>
          <a class="cursor-pointer hover:text-gray-200" @click="$emit('open-modal','parametres')">Paramètres</a>
          <a class="cursor-pointer hover:text-gray-200" @click="$emit('open-modal','about')">À propos</a>
        </div>
      </div>
    </div>

    <DisclosurePanel class="md:hidden bg-blue-800 space-y-2 px-4 py-4">
      <a :class="langStore.current==='fr'? 'block font-bold text-white':'block text-blue-200'" @click.prevent="changeLanguage('fr')">Français</a>
      <a :class="langStore.current==='en'? 'block font-bold text-white':'block text-blue-200'" @click.prevent="changeLanguage('en')">English</a>
      <hr class="border-blue-700 my-2">
      <a class="block py-1 text-blue-100" @click="$emit('open-modal','aide')">Aide</a>
      <a class="block py-1 text-blue-100" @click="$emit('open-modal','parametres')">Paramètres</a>
      <a class="block py-1 text-blue-100" @click="$emit('open-modal','about')">À propos</a>
    </DisclosurePanel>
  </Disclosure>
</template>

<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { useLangStore } from '../stores/lang'
import { useFormStore } from '../stores/form'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps(['currentMode'])
const emit = defineEmits(['update:mode', 'open-modal', 'select-task'])

const langStore = useLangStore()
const formStore = useFormStore()

// Gestion du mode de vol (IFR/VFR)
const flightMode = ref(localStorage.getItem('flightMode') || 'IFR')

const toggleFlightMode = () => {
  flightMode.value = flightMode.value === 'IFR' ? 'VFR' : 'IFR'
  localStorage.setItem('flightMode', flightMode.value)
  emit('update:mode', flightMode.value)
}

const changeLanguage = (lang: string) => langStore.changeLanguage(lang)

// Raccourcis clavier (PTT) - Gardés pour la V2
function onKeyDown(e: KeyboardEvent) {}
function onKeyUp(e: KeyboardEvent) {}

// Initialisation des variables globales et events
onMounted(() => {
  emit('update:mode', flightMode.value)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  
  // Setup des variables globales nécessaires au reste de l'app
  window.isRecordingActive = false
  window.lastTranscriptTaskId = null
  window.currentTaskId = null
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

/**
 * Fonctions de traitement de texte (Placeholders)
 * Gardées ici car elles sont utilisées pour l'affichage dynamique
 */
function replacePlaceholders(text: string): string {
  const lang = langStore.current as 'fr' | 'en'
  
  const now = new Date()
  const currentHour = `${now.getUTCHours().toString().padStart(2, '0')}h${now.getMinutes().toString().padStart(2, '0')}`
  
  const getHeureLabel = () => {
    const h = new Date().getHours()
    return h < 19 ? (lang === 'fr' ? 'bonjour' : 'hello') : (lang === 'fr' ? 'bonsoir' : 'good evening')
  }

  const replacements: Record<string, string> = {
    '[POL]': getHeureLabel(),
    '[CAA]': formStore.form.CAA,
    '[CAL]': formStore.form.CAL,
    '[RWY]': formStore.formatRunway(formStore.form.RWY, lang),
    '[NIV]': formStore.form.NIV,
    '[STA]': formStore.form.STA,
    '[WPT]': formStore.form.WPT,
    '[DEP]': formStore.form.DEP,
    '[ARR]': formStore.form.ARR,
    '[TWR]': formStore.form.TWR,
    '[APP]': formStore.form.APP,
    '[QNH]': formStore.form.QNH,
    '[SQU]': formStore.form.SQU,
    '[VOI]': formStore.form.VOI,
    '[INF]': formStore.form.INF,
    '[HOU]': currentHour
  }
  
  let result = text
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '')
  }
  return result
}

// Global Types pour TypeScript
declare global {
  interface Window {
    readbackTimer: number | null;
    isRecordingActive: boolean;
    lastTranscriptTaskId: string | null;
    currentTaskId: string | null;
  }
}
</script>