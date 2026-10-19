<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal w-full max-h-screen overflow-y-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-screen overflow-y-auto">
      <div class="flex justify-between items-center border-b pb-2">
        <h4 class="text-lg font-semibold">Paramètres</h4>
        <button @click="close" class="text-gray-600 hover:text-gray-800" aria-label="Fermer les paramètres">&times;</button>
      </div>

      <form class="mt-4 space-y-5" @submit.prevent>
        <fieldset v-for="section in visibleSections" :key="section.title" class="border rounded-lg px-4 pb-3 pt-1">
          <legend class="px-1 text-sm font-semibold">{{ section.title }}</legend>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
            <div v-for="field in section.fields" :key="field.id" :class="{ relative: field.clearable }">
              <label :for="field.id" class="label-field">{{ field.label }}</label>

              <!-- Code SELCAL : écoute et validation -->
              <template v-if="field.id === 'SEL'">
                <div class="flex gap-2 items-center">
                  <input
                    type="text"
                    id="SEL"
                    v-model="formStore.form.SEL"
                    @change="updateForm"
                    maxlength="5"
                    placeholder="AD-RS"
                    aria-describedby="SEL-erreur"
                    class="input-field uppercase"
                  >
                  <button
                    type="button"
                    class="shrink-0 px-2 py-1 rounded border hover:bg-blue-500/10 disabled:opacity-40"
                    :disabled="!selcal.valid"
                    :title="`Écouter le code SELCAL ${selcalLabel}`"
                    :aria-label="`Écouter le code SELCAL ${selcalLabel}`"
                    @click="playSelcal(formStore.form.SEL ?? '')"
                  >▶</button>
                </div>
                <p id="SEL-erreur" v-if="formStore.form.SEL && !selcal.valid" class="ko-text text-xs mt-1" aria-live="polite">{{ selcal.reasons[0] }}</p>
              </template>

              <template v-else>
                <input
                  type="text"
                  :id="field.id"
                  v-model="formStore.form[field.id]"
                  @change="updateForm"
                  :placeholder="field.placeholder"
                  :class="['input-field', { 'pr-10 w-full': field.clearable }]"
                />
                <!-- Fréquence : un champ vide ferme la station (les répliques qui en dépendent sont masquées) -->
                <button
                  v-if="field.clearable && formStore.form[field.id]"
                  type="button"
                  @click="clearInput(field.id)"
                  class="absolute right-3 top-9 text-gray-400 hover:text-red-500"
                  :aria-label="`Effacer ${field.label}`"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"/>
                  </svg>
                </button>
              </template>
            </div>
          </div>
        </fieldset>
      </form>

      <div class="mt-6 flex justify-end">
        <button @click="close" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormStore } from '../stores/form'
import { checkSelcal, formatSelcal, playSelcal } from '../utils/selcal'

const props = withDefaults(defineProps<{ currentMode?: string }>(), { currentMode: 'IFR' })

interface Field {
  id: string
  label: string
  /** Champ propre à une règle de vol (absent : les deux) */
  mode?: 'VFR' | 'IFR'
  placeholder?: string
  /** Fréquence : bouton pour vider le champ (station fermée) */
  clearable?: boolean
}

const formStore = useFormStore()
const isOpen = ref(false)
const isVFR = computed(() => props.currentMode === 'VFR')

/** Paramètres rangés par moment du vol */
const SECTIONS = computed((): { title: string; fields: Field[] }[] => [
  {
    title: 'Avion et indicatif',
    fields: [
      { id: 'COM', label: isVFR.value ? "Type d'appareil" : 'Compagnie' },
      { id: 'CAL', label: "Indicatif d'appel" },
      { id: 'CAA', label: 'Indicatif abrégé' },
      { id: 'SQU', label: 'Code transpondeur' },
      { id: 'SEL', label: 'Code SELCAL', mode: 'IFR' },
    ],
  },
  {
    title: 'Départ',
    fields: [
      { id: 'DEP', label: 'Aéroport de départ' },
      { id: 'POS', label: 'Position (parking)' },
      { id: 'VOI', label: 'Voies de circulation' },
      { id: 'HLD', label: "Point d'attente" },
      { id: 'RWY', label: 'Piste de départ' },
      { id: 'MET', label: 'Code OACI METAR' },
      { id: 'INF', label: 'Information ATIS' },
      { id: 'SID', label: 'SID', mode: 'IFR', placeholder: 'MIRGU 7H' },
      { id: 'NIV', label: 'Niveau SID / STAR', mode: 'IFR' },
    ],
  },
  {
    title: 'En route',
    fields: [
      { id: 'FIR', label: 'FIR' },
      { id: 'WPT', label: 'Point de report', mode: 'IFR' },
      { id: 'NIVC', label: 'Niveau de croisière', mode: 'IFR' },
      { id: 'VIT', label: 'Vitesse', mode: 'IFR' },
      { id: 'CAP', label: 'Cap' },
      { id: 'SORTIE', label: 'Point de sortie', mode: 'VFR' },
      { id: 'ALT', label: 'Altitude (pieds)', mode: 'VFR' },
      { id: 'TTWR', label: 'Transit (aérodrome)', mode: 'VFR' },
    ],
  },
  {
    title: 'Arrivée',
    fields: [
      { id: 'ARR', label: "Aéroport d'arrivée" },
      { id: 'STAR', label: 'STAR', mode: 'IFR', placeholder: 'EPINAL 9E' },
      { id: 'RWYA', label: "Piste d'arrivée" },
      { id: 'POSA', label: 'Position (parking)' },
      { id: 'VOIA', label: 'Voies de circulation', mode: 'IFR' },
    ],
  },
  {
    title: 'Fréquences',
    fields: [
      { id: 'DEL', label: 'Prévol', clearable: true },
      { id: 'GND', label: 'Sol', clearable: true },
      { id: 'TWR', label: 'Tour', clearable: true },
      { id: 'APP', label: 'Approche', clearable: true },
      { id: 'CTR', label: 'En route', mode: 'IFR', clearable: true },
    ],
  },
])

const visibleSections = computed(() =>
  SECTIONS.value.map((s) => ({ ...s, fields: s.fields.filter((f) => !f.mode || f.mode === props.currentMode) }))
)

const selcal = computed(() => checkSelcal(formStore.form.SEL ?? ''))
const selcalLabel = computed(() => (selcal.value.valid ? formatSelcal(selcal.value.letters) : ''))

const updateForm = () => formStore.updateFormData(formStore.form)

const clearInput = (field: string) => {
  formStore.form[field] = ''
  updateForm()
}

const open = () => {
  // Store encore vide : lecture des paramètres enregistrés
  if (!formStore.form.DEP) formStore.initializeFormData()
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

defineExpose({ open, close })
</script>
