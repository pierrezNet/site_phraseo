<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal w-full max-h-screen overflow-y-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-screen overflow-y-auto">
      <div class="flex justify-between items-center border-b pb-2">
        <h4 class="text-lg font-semibold">{{ t('nav.flightParams') }}</h4>
        <button @click="close" class="text-gray-600 hover:text-gray-800" :aria-label="t('params.close')">&times;</button>
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
                    :title="t('params.listenSelcal', { code: selcalLabel })"
                    :aria-label="t('params.listenSelcal', { code: selcalLabel })"
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
                  :aria-label="t('params.clear', { field: field.label })"
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
          {{ t('common.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormStore } from '../stores/form'
import { checkSelcal, formatSelcal, playSelcal } from '../utils/selcal'
import { useI18n } from '../i18n'

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
const { t, lang } = useI18n()
const isOpen = ref(false)
const isVFR = computed(() => props.currentMode === 'VFR')

/** Paramètres rangés par moment du vol */
const SECTIONS = computed((): { title: string; fields: Field[] }[] => [
  {
    title: t('section.aircraft'),
    fields: [
      { id: 'COM', label: t(isVFR.value ? 'field.COM.VFR' : 'field.COM.IFR') },
      { id: 'CAL', label: t('field.CAL') },
      { id: 'CAA', label: t('field.CAA') },
      { id: 'SQU', label: t('field.SQU') },
      { id: 'SEL', label: t('field.SEL'), mode: 'IFR' },
    ],
  },
  {
    title: t('section.departure'),
    fields: [
      { id: 'DEP', label: t('field.DEP') },
      { id: 'POS', label: t('field.POS') },
      { id: 'VOI', label: t('field.VOI') },
      { id: 'HLD', label: t('field.HLD') },
      { id: 'RWY', label: t('field.RWY') },
      { id: 'MET', label: t('field.MET') },
      { id: 'INF', label: t('field.INF') },
      { id: 'SID', label: t('field.SID'), mode: 'IFR', placeholder: 'MIRGU 7H' },
      { id: 'NIV', label: t('field.NIV'), mode: 'IFR' },
    ],
  },
  {
    title: t('section.enroute'),
    fields: [
      { id: 'FIR', label: t('field.FIR') },
      { id: 'WPT', label: t('field.WPT'), mode: 'IFR' },
      { id: 'NIVC', label: t('field.NIVC'), mode: 'IFR' },
      { id: 'VIT', label: t('field.VIT'), mode: 'IFR' },
      { id: 'CAP', label: t('field.CAP') },
      { id: 'SORTIE', label: t('field.SORTIE'), mode: 'VFR' },
      { id: 'ALT', label: t('field.ALT'), mode: 'VFR' },
      { id: 'TTWR', label: t('field.TTWR'), mode: 'VFR' },
    ],
  },
  {
    title: t('section.arrival'),
    fields: [
      { id: 'ARR', label: t('field.ARR') },
      { id: 'STAR', label: t('field.STAR'), mode: 'IFR', placeholder: 'EPINAL 9E' },
      { id: 'RWYA', label: t('field.RWYA') },
      { id: 'POSA', label: t('field.POSA') },
      { id: 'VOIA', label: t('field.VOIA'), mode: 'IFR' },
    ],
  },
  {
    title: t('section.frequencies'),
    fields: [
      { id: 'DEL', label: t('field.DEL'), clearable: true },
      { id: 'GND', label: t('field.GND'), clearable: true },
      { id: 'TWR', label: t('field.TWR'), clearable: true },
      { id: 'APP', label: t('field.APP'), clearable: true },
      { id: 'CTR', label: t('field.CTR'), mode: 'IFR', clearable: true },
    ],
  },
])

const visibleSections = computed(() =>
  SECTIONS.value.map((s) => ({ ...s, fields: s.fields.filter((f) => !f.mode || f.mode === props.currentMode) }))
)

const selcal = computed(() => checkSelcal(formStore.form.SEL ?? '', lang.ui))
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
