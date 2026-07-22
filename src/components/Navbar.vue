<template>
  <Disclosure as="nav" class="bg-blue-900 text-white" v-slot="{ open }">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <div class="flex items-center space-x-3 bg-blue-800/50">
          <span class="text-2xl font-bold">Phraséologie</span><span class="text-2xl font-bold hidden md:flex"> aéronautique </span>
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

          <div class="hidden md:flex items-center">
            <div class="h-6 w-px bg-blue-700 mx-2"></div>
            <div class="flex items-center space-x-1">
              <button
                v-for="level in levels"
                :key="level.value"
                :disabled="level.disabled"
                @click="setLevel(level.value)"
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                  level.disabled
                    ? 'bg-blue-900/50 text-blue-700 cursor-not-allowed'
                    : formStore.form.LEVEL === level.value
                      ? 'bg-white text-blue-900'
                      : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
                ]"
                :title="level.disabled ? 'Bientôt disponible' : level.label"
              >
                {{ level.short }}
              </button>
            </div>

            <template v-if="quizAvailable">
              <div class="h-6 w-px bg-blue-700 mx-2"></div>
              <button
                @click="quizStore.toggle()"
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                  quizStore.enabled ? 'bg-green-500 text-white' : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
                ]"
                title="Mode quiz : masque les réponses pilote pour s'entraîner"
              >
                Quiz {{ quizStore.enabled ? 'ON' : 'OFF' }}
              </button>
            </template>
          </div>
        </div>

        <DisclosureButton class="md:hidden p-2">
          <span v-if="!open" class="text-2xl">☰</span>
          <span v-else class="text-2xl">✕</span>
        </DisclosureButton>

        <div class="hidden md:flex space-x-3 items-center">
          <a :class="langStore.current==='fr'? 'font-bold underline underline-offset-4':'hover:text-gray-200 cursor-pointer'" @click.prevent="changeLanguage('fr')" title="Français">FR</a>
          <a :class="langStore.current==='en'? 'font-bold underline underline-offset-4':'hover:text-gray-200 cursor-pointer'" @click.prevent="changeLanguage('en')" title="English">EN</a>

          <div class="h-6 w-px bg-blue-700 mx-1"></div>

          <a class="cursor-pointer hover:text-gray-200 flex items-center gap-1" @click="$emit('open-modal','parametres')" title="Paramètres du vol">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Paramètres</span>
          </a>

          <Menu as="div" class="relative">
            <MenuButton class="cursor-pointer hover:text-gray-200 flex items-center gap-1 focus:outline-none">
              Plus <span class="text-xs">▾</span>
            </MenuButton>
            <MenuItems class="absolute right-0 mt-2 w-44 bg-white text-gray-800 rounded-md shadow-lg py-1 z-50 focus:outline-none">
              <MenuItem v-slot="{ active }">
                <button :class="['block w-full text-left px-4 py-2', active ? 'bg-blue-600 text-white' : '']" @click="$emit('open-modal','aide')">Aide</button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button :class="['block w-full text-left px-4 py-2', active ? 'bg-blue-600 text-white' : '']" @click="$emit('open-modal','about')">À propos</button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button :class="['block w-full text-left px-4 py-2', active ? 'bg-blue-600 text-white' : '']" @click="$emit('open-modal','feedback')">J'ai un retour</button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <a href="https://discord.gg/aKJ8YVGzE" target="_blank" rel="noopener noreferrer" :class="['block px-4 py-2 font-medium', active ? 'bg-blue-600 text-white' : '']">Discord</a>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </div>

    <DisclosurePanel class="md:hidden bg-blue-800 space-y-2 px-4 py-4">
      <a :class="langStore.current==='fr'? 'block font-bold text-white':'block text-blue-200'" @click.prevent="changeLanguage('fr')">Français</a>
      <a :class="langStore.current==='en'? 'block font-bold text-white':'block text-blue-200'" @click.prevent="changeLanguage('en')">English</a>
      <hr class="border-blue-700 my-2">
      <div class="flex items-center space-x-2 py-1">
        <span class="text-blue-200 text-sm">Niveau :</span>
        <button
          v-for="level in levels"
          :key="level.value"
          :disabled="level.disabled"
          @click="setLevel(level.value)"
          :class="[
            'px-2 py-0.5 rounded text-xs font-medium transition-colors',
            level.disabled
              ? 'bg-blue-900/50 text-blue-700 cursor-not-allowed'
              : formStore.form.LEVEL === level.value
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
          ]"
        >
          {{ level.short }}
        </button>
      </div>
      <div v-if="quizAvailable" class="flex items-center space-x-2 py-1">
        <span class="text-blue-200 text-sm">Quiz :</span>
        <button
          @click="quizStore.toggle()"
          :class="[
            'px-2 py-0.5 rounded text-xs font-medium transition-colors',
            quizStore.enabled ? 'bg-green-500 text-white' : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
          ]"
        >
          {{ quizStore.enabled ? 'Activé' : 'Désactivé' }}
        </button>
      </div>
      <hr class="border-blue-700 my-2">
      <a class="block py-1 text-blue-100" @click="$emit('open-modal','aide')">Aide</a>
      <a class="block py-1 text-blue-100" @click="$emit('open-modal','parametres')">Paramètres</a>
      <a class="block py-1 text-blue-100" @click="$emit('open-modal','about')">À propos</a>
      <a class="block py-1 text-blue-100" @click="$emit('open-modal','feedback')">J'ai un retour</a>
      <a href="https://discord.gg/aKJ8YVGzE" target="_blank" rel="noopener noreferrer" class="block py-1 text-blue-100 font-medium">Rejoindre le Discord</a>
    </DisclosurePanel>
  </Disclosure>
</template>

<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useLangStore } from '../stores/lang'
import { useFormStore, type UserLevel } from '../stores/form'
import { useQuizStore } from '../stores/quiz'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps(['currentMode'])
const emit = defineEmits(['update:mode', 'open-modal', 'select-task'])

const langStore = useLangStore()
const formStore = useFormStore()
const quizStore = useQuizStore()

// Gestion du mode de vol (IFR/VFR)
const flightMode = ref(localStorage.getItem('flightMode') || 'IFR')

// Le mode quiz est disponible dans tous les modes et niveaux
const quizAvailable = computed(() => true)

const toggleFlightMode = () => {
  flightMode.value = flightMode.value === 'IFR' ? 'VFR' : 'IFR'
  localStorage.setItem('flightMode', flightMode.value)
  // Paramètres indépendants par mode : on échange l'instantané VFR/IFR
  formStore.switchMode(flightMode.value as 'VFR' | 'IFR')
  emit('update:mode', flightMode.value)
}

const levels = [
  { value: 'débutant' as UserLevel, label: 'Débutant', short: 'Déb', disabled: false },
  { value: 'intermédiaire' as UserLevel, label: 'Intermédiaire', short: 'Int', disabled: false },
  { value: 'avancé' as UserLevel, label: 'Avancé', short: 'Av', disabled: false }
]

const setLevel = (level: UserLevel) => {
  formStore.form.LEVEL = level
  formStore.updateFormData(formStore.form)
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