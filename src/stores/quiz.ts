import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * État du mode quiz : masque les réponses pilote pour entraînement actif.
 * Disponible dans tous les modes et niveaux.
 */
export const useQuizStore = defineStore('quiz', () => {
  const enabled = ref(false)

  /**
   * Dernier texte à insérer dans la réponse en cours (clic sur le bandeau de vol).
   * `n` change à chaque demande, pour réagir même si le texte est identique.
   */
  const insertion = ref<{ text: string; n: number } | null>(null)

  function toggle() {
    enabled.value = !enabled.value
  }

  function disable() {
    enabled.value = false
  }

  function insertIntoAnswer(text: string) {
    insertion.value = { text, n: (insertion.value?.n ?? 0) + 1 }
  }

  return { enabled, insertion, toggle, disable, insertIntoAnswer }
})
