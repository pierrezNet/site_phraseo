import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Message éphémère (toast) : une explication montrée au moment utile, puis effacée */
export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null

  function show(text: string, ms = 5000) {
    message.value = text
    if (timer) clearTimeout(timer)
    timer = setTimeout(hide, ms)
  }

  function hide() {
    message.value = ''
    if (timer) clearTimeout(timer)
    timer = null
  }

  return { message, show, hide }
})
