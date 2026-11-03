<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal">
      <!-- Modal Content -->
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center border-b pb-2">
          <h2 class="text-lg font-semibold">{{ t('nav.about') }}</h2>
          <button @click="close" class="text-gray-600 hover:text-gray-800" :aria-label="t('common.close')">
            &times;
          </button>
        </div>
        <AboutEn v-if="lang.ui === 'en'" class="mt-4" />
        <AboutFr v-else class="mt-4" />
        <div class="mt-6 flex justify-end">
          <button @click="close" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../i18n';
import AboutFr from './help/AboutFr.vue';
import AboutEn from './help/AboutEn.vue';

const { t, lang } = useI18n();
const isOpen = ref(false);

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

defineExpose({ open, close });
</script>
