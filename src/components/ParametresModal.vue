<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal w-full max-h-screen overflow-y-auto">
  <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl max-h-screen overflow-y-auto">
    <div class="flex justify-between items-center border-b pb-2">
      <h4 class="text-lg font-semibold">Paramètres</h4>
      <button @click="close" class="text-gray-600 hover:text-gray-800">&times;</button>
    </div>
      <form class="mt-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 md:space-x-4 gap-y-4">
          <div>
            <div>
              <label for="FIR" class="label-field">FIR</label>
              <input type="text" id="FIR" v-model="formStore.form.FIR" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="DEP" class="label-field">Aéroport de départ</label>
              <input type="text" id="DEP" v-model="formStore.form.DEP" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="POS" class="label-field">Position</label>
              <input type="text" id="POS" v-model="formStore.form.POS" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="ARR" class="label-field">Aéroport d'arrivée</label>
              <input type="text" id="ARR" v-model="formStore.form.ARR" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="COM" class="label-field">{{ isVFR() ? "Type d'appareil" : "Compagnie" }}</label>
              <input type="text" id="COM" :value="isVFR() ? formStore.form.COM_VFR : formStore.form.COM_IFR" @input="updateCallsign('COM', $event)" class="input-field">
            </div>
            <div>
              <label for="CAL" class="label-field">Indicatif d'appel</label>
              <input type="text" id="CAL" :value="isVFR() ? formStore.form.CAL_VFR : formStore.form.CAL_IFR" @input="updateCallsign('CAL', $event)" class="input-field">
            </div>
            <div>
              <label for="CAA" class="label-field">Indicatif abrégé</label>
              <input type="text" id="CAA" :value="isVFR() ? formStore.form.CAA_VFR : formStore.form.CAA_IFR" @input="updateCallsign('CAA', $event)" class="input-field">
            </div>
            <div>
              <label for="INF" class="label-field">Information contrôleur</label>
              <input type="text" id="INF" v-model="formStore.form.INF" @change="updateForm" class="input-field">
            </div>
          </div>
          <div>
            <div v-if="!isVFR()">
              <label for="WPT" class="label-field">Waypoint</label>
              <input type="text" id="WPT" v-model="formStore.form.WPT" @change="updateForm" class="input-field">
            </div>
            <div v-if="!isVFR()">
              <label for="STA" class="label-field">SID/STAR</label>
              <input type="text" id="STA" v-model="formStore.form.STA" @change="updateForm" class="input-field">
            </div>
            <div v-if="isVFR()">
              <label for="SORTIE" class="label-field">Point de sortie</label>
              <input type="text" id="SORTIE" v-model="formStore.form.SORTIE" @change="updateForm" class="input-field">
            </div>
            <div v-if="isVFR()">
              <label for="ALT" class="label-field">Altitude (pieds)</label>
              <input type="text" id="ALT" v-model="formStore.form.ALT" @change="updateForm" class="input-field">
            </div>
            <div v-if="isVFR()">
              <label for="TTWR" class="label-field">Transit (aérodrome)</label>
              <input type="text" id="TTWR" v-model="formStore.form.TTWR" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="VOI" class="label-field">Voies de circulation</label>
              <input type="text" id="VOI" v-model="formStore.form.VOI" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="HLD" class="label-field">Point d'arrêt</label>
              <input type="text" id="HLD" v-model="formStore.form.HLD" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="MET" class="label-field">Code OACI METAR</label>
              <input type="text" id="MET" v-model="formStore.form.MET" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="RWY" class="label-field">Piste en service</label>
              <input type="text" id="RWY" v-model="formStore.form.RWY" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="SQU" class="label-field">Code transpondeur</label>
              <input type="text" id="SQU" :value="isVFR() ? formStore.form.SQU_VFR : formStore.form.SQU_IFR" @input="updateSquawk($event)" class="input-field">
            </div>
          </div>
          <div>
            <div v-if="!isVFR()">
              <label for="NIV" class="label-field">Niveau</label>
              <input type="text" id="NIV" v-model="formStore.form.NIV" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="VIT" class="label-field">Vitesse</label>
              <input type="text" id="VIT" v-model="formStore.form.VIT" @change="updateForm" class="input-field">
            </div>
            <div>
              <label for="CAP" class="label-field">Cap</label>
              <input type="text" id="CAP" v-model="formStore.form.CAP" @change="updateForm" class="input-field">
            </div>
            <div class="relative mb-4">
              <label for="DEL" class="label-field">Prévol</label>
              <input
                type="text"
                id="DEL"
                v-model="formStore.form.DEL"
                @change="updateForm"
                class="input-field pr-10 w-full"
              />
              <button
                type="button"
                @click="clearInput('DEL')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                v-if="formStore.form.DEL"
                aria-label="Effacer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"/>
                </svg>
              </button>
            </div>
            <div class="relative mb-4">
              <label for="GND" class="label-field">Sol</label>
              <input
                type="text"
                id="GND"
                v-model="formStore.form.GND"
                @change="updateForm"
                class="input-field pr-10 w-full"
              />
              <button
                type="button"
                @click="clearInput('GND')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                v-if="formStore.form.GND"
                aria-label="Effacer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"/>
                </svg>
              </button>
            </div>
            <div class="relative mb-4">
              <label for="TWR" class="label-field">Tour</label>
              <input
                type="text"
                id="TWR"
                v-model="formStore.form.TWR"
                @change="updateForm"
                class="input-field pr-10 w-full"
              />
              <button
                type="button"
                @click="clearInput('TWR')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                v-if="formStore.form.TWR"
                aria-label="Effacer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"/>
                </svg>
              </button>
            </div>
            <div class="relative mb-4">
              <label for="APP" class="label-field">Approche</label>
              <input
                type="text"
                id="vAPP"
                v-model="formStore.form.APP"
                @change="updateForm"
                class="input-field pr-10 w-full"
              />
              <button
                type="button"
                @click="clearInput('APP')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                v-if="formStore.form.APP"
                aria-label="Effacer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"/>
                </svg>
              </button>
            </div>
            <div class="relative mb-4">
              <label for="CTR" class="label-field">En route</label>
              <input
                type="text"
                id="CTR"
                v-model="formStore.form.CTR"
                @change="updateForm"
                class="input-field pr-10 w-full"
              />
              <button
                type="button"
                @click="clearInput('CTR')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                v-if="formStore.form.CTR"
                aria-label="Effacer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
      <div class="mt-6 flex justify-end">
        <button @click="close" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useFormStore } from '../stores/form'

export default defineComponent({
  name: 'ParametresModal',
  props: {
    currentMode: {
      type: String,
      default: 'IFR'
    }
  },
  setup(props) {
    const isOpen = ref(false)
    const formStore = useFormStore()
    const isVFR = () => props.currentMode === 'VFR'

    const open = () => {
      if (!formStore.form.DEP) {
        // Si le store est vide (ou à adapter selon ton cas)
        formStore.initializeFormData()
      }
      isOpen.value = true
    }

    const clearInput = (field: keyof typeof formStore.form) => {
      formStore.form[field] = ''
      updateForm()
    }

    const close = () => {
      isOpen.value = false
    }

    const updateCallsign = (field: 'CAL' | 'CAA' | 'COM', event: Event) => {
      const value = (event.target as HTMLInputElement).value
      const suffix = props.currentMode === 'VFR' ? '_VFR' : '_IFR'
      formStore.form[field + suffix] = value
      formStore.form[field] = value
      updateForm()
    }

    const updateSquawk = (event: Event) => {
      const value = (event.target as HTMLInputElement).value
      if (props.currentMode === 'VFR') {
        formStore.form.SQU_VFR = value
      } else {
        formStore.form.SQU_IFR = value
      }
      formStore.form.SQU = value
      updateForm()
    }

    const updateForm = () => {
      formStore.updateFormData(formStore.form);
    }

    return {
      isOpen,
      formStore,
      isVFR,
      open,
      close,
      clearInput,
      updateCallsign,
      updateSquawk,
      updateForm
    }
  }
})
</script>

<style scoped>
/* Ajouter des styles spécifiques au composant si nécessaire */
</style>
