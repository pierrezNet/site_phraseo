import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * État du mode quiz : masque les réponses pilote pour entraînement actif.
 * N'est disponible qu'en VFR débutant pour l'instant (géré côté Navbar).
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
