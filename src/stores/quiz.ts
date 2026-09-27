import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * État du mode quiz : masque les réponses pilote pour entraînement actif.
 * Disponible dans tous les modes et niveaux.
 */
export const useQuizStore = defineStore('quiz', () => {
  const enabled = ref(false)

  function toggle() {
    enabled.value = !enabled.value
  }

  function disable() {
    enabled.value = false
  }

  return { enabled, toggle, disable }
})
