<template>
  <Disclosure as="nav" class="bg-blue-900 text-white shrink-0" v-slot="{ open }">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between gap-4 h-12 md:h-16">

        <!-- Titre et règles de vol : ce qui change toute l'application -->
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-xl md:text-2xl font-bold truncate">
            <span class="md:hidden">{{ t('app.titleShort') }}</span>
            <span class="hidden md:inline">{{ t('app.title') }}</span>
          </span>
          <div class="flex items-center gap-2 shrink-0" role="group" :aria-label="t('nav.rules')">
            <span :class="['font-bold transition-colors', flightMode === 'IFR' ? 'text-white' : 'text-blue-400']">IFR</span>
            <label class="relative inline-block w-12 h-6 cursor-pointer">
              <input
                type="checkbox"
                class="sr-only peer"
                :checked="flightMode === 'VFR'"
                :aria-label="`${t('nav.rules')} : ${flightMode}`"
                @change="toggleFlightMode"
              >
              <div class="w-full h-full bg-gray-500 rounded-full peer transition-colors peer-checked:bg-blue-500 peer-focus-visible:ring-2 peer-focus-visible:ring-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
            </label>
            <span :class="['font-bold transition-colors', flightMode === 'VFR' ? 'text-white' : 'text-blue-400']">VFR</span>
          </div>
        </div>

        <DisclosureButton class="md:hidden p-2" :aria-label="t('nav.menu')">
          <span v-if="!open" class="text-2xl">☰</span>
          <span v-else class="text-2xl">✕</span>
        </DisclosureButton>

        <!-- Bureau : réglages regroupés dans un panneau, comme sur mobile -->
        <div class="hidden md:flex items-center gap-5">
          <Popover class="relative">
            <PopoverButton class="nav-link flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
                <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
              </svg>
              <span>{{ t('nav.preferences') }}</span>
              <span class="text-xs text-blue-200 font-normal">{{ summary }}</span>
              <span class="text-xs">▾</span>
            </PopoverButton>
            <PopoverPanel class="absolute right-0 mt-3 w-96 bg-blue-800 text-white rounded-lg shadow-xl p-4 z-50">
              <SettingsPanel />
            </PopoverPanel>
          </Popover>

          <button type="button" class="nav-link flex items-center gap-1" @click="$emit('open-modal','parametres')">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{{ t('nav.flightParams') }}</span>
          </button>

          <Menu as="div" class="relative">
            <MenuButton class="nav-link flex items-center gap-1">
              {{ t('nav.more') }} <span class="text-xs">▾</span>
            </MenuButton>
            <MenuItems class="absolute right-0 mt-3 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 z-50 focus:outline-none">
              <MenuItem v-for="item in MODAL_LINKS" :key="item.modal" v-slot="{ active }">
                <button :class="['block w-full text-left px-4 py-2', active ? 'bg-blue-600 text-white' : '']" @click="$emit('open-modal', item.modal)">{{ t(item.label) }}</button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <a :href="forumUrl(lang.ui)" target="_blank" rel="noopener noreferrer" :class="['block px-4 py-2 font-medium', active ? 'bg-blue-600 text-white' : '']">{{ t('nav.forum') }}</a>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </div>

    <!-- Mobile : mêmes réglages, puis les pages -->
    <DisclosurePanel class="md:hidden bg-blue-800 px-4 py-4">
      <SettingsPanel />
      <hr class="border-blue-700 my-3">
      <div class="space-y-1">
        <button type="button" class="block w-full text-left py-1 text-blue-100" @click="$emit('open-modal','parametres')">{{ t('nav.flightParams') }}</button>
        <button v-for="item in MODAL_LINKS" :key="item.modal" type="button" class="block w-full text-left py-1 text-blue-100" @click="$emit('open-modal', item.modal)">{{ t(item.label) }}</button>
        <a :href="forumUrl(lang.ui)" target="_blank" rel="noopener noreferrer" class="block py-1 text-blue-100 font-medium">{{ t('nav.forum') }}</a>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>

<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItems, MenuItem, Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { useFormStore } from '../stores/form'
import { useQuizStore } from '../stores/quiz'
import { forumUrl, useI18n, type MessageKey } from '../i18n'
import SettingsPanel from './SettingsPanel.vue'
import { computed, onMounted } from 'vue'

const MODAL_LINKS: { modal: string; label: MessageKey }[] = [
  { modal: 'aide', label: 'nav.help' },
  { modal: 'about', label: 'nav.about' },
  { modal: 'feedback', label: 'nav.feedback' },
]

const emit = defineEmits(['update:mode', 'open-modal', 'select-task'])

const { t, lang } = useI18n()
const formStore = useFormStore()
const quizStore = useQuizStore()

// Gestion du mode de vol (IFR/VFR), porté par le store du formulaire
const flightMode = computed(() => formStore.mode)

/** Rappel des réglages en cours, à côté du bouton : « Débutant · EN · Quiz » */
const summary = computed(() =>
  [
    t(`level.${formStore.form.LEVEL}` as MessageKey),
    lang.current.toUpperCase(),
    quizStore.enabled ? t('pref.quiz') : '',
  ].filter(Boolean).join(' · ')
)

const toggleFlightMode = () => {
  // Paramètres indépendants par mode : on échange l'instantané VFR/IFR
  formStore.switchMode(flightMode.value === 'IFR' ? 'VFR' : 'IFR')
  emit('update:mode', flightMode.value)
}

onMounted(() => emit('update:mode', flightMode.value))
</script>

<style scoped>
.nav-link {
  cursor: pointer;
  font-weight: 500;
}
.nav-link:hover {
  color: #e5e7eb;
}
.nav-link:focus-visible {
  outline: 2px solid white;
  outline-offset: 4px;
  border-radius: 0.25rem;
}
</style>
