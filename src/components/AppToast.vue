<template>
  <Transition name="toast">
    <div
      v-if="toast.message"
      role="status"
      class="notice fixed z-40 left-1/2 -translate-x-1/2 top-14 md:top-20 w-[calc(100%-2rem)] max-w-md rounded-lg px-4 py-3 text-sm shadow-lg flex items-start gap-3"
    >
      <span class="flex-1">{{ toast.message }}</span>
      <button type="button" class="shrink-0 opacity-70 hover:opacity-100" :aria-label="t('common.close')" @click="toast.hide()">&times;</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useToastStore } from '../stores/toast'
import { useI18n } from '../i18n'

const toast = useToastStore()
const { t } = useI18n()
</script>

<style scoped>
/* Fond opaque : le toast passe au-dessus du contenu */
.notice {
  background-color: var(--group-bg);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -0.5rem);
}
</style>
