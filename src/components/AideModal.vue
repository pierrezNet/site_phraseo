<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal">
      <!-- Modal Content -->
      <div ref="scroller" class="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center border-b pb-2">
          <h4 class="text-lg font-semibold">{{ t('nav.help') }}</h4>
          <button @click="close" class="text-gray-600 hover:text-gray-800" :aria-label="t('help.close')">
            &times;
          </button>
        </div>

        <!-- Sommaire : reste visible pendant le défilement -->
        <nav ref="toc" :aria-label="t('help.toc')" class="sticky -top-6 z-10 bg-white -mx-6 px-6 pt-3 pb-2 border-b">
          <!-- Une seule ligne ; sur petit écran, elle défile horizontalement -->
          <ul class="flex flex-nowrap gap-1.5 text-xs overflow-x-auto whitespace-nowrap">
            <li v-for="s in SECTIONS" :key="s.id">
              <button type="button" class="px-2 py-1 rounded border hover:bg-blue-500/10" @click="goTo(s.id)">{{ t(s.title) }}</button>
            </li>
          </ul>
        </nav>

        <HelpEn v-if="lang.ui === 'en'" class="mt-4" />
        <HelpFr v-else class="mt-4" />
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
import { useI18n, type MessageKey } from '../i18n';
import HelpFr from './help/HelpFr.vue';
import HelpEn from './help/HelpEn.vue';

const { t, lang } = useI18n();

/** Sommaire : ancres des titres des contenus (help/HelpFr.vue, help/HelpEn.vue) */
const SECTIONS: { id: string; title: MessageKey }[] = [
  { id: 'aide-utilisation', title: 'help.start' },
  { id: 'aide-niveaux', title: 'help.levels' },
  { id: 'aide-icones', title: 'help.icons' },
  { id: 'aide-quiz', title: 'help.quiz' },
  { id: 'aide-vol', title: 'flight.full' },
  { id: 'aide-voix', title: 'help.voice' },
  { id: 'aide-carte', title: 'help.map' },
  { id: 'aide-meteo', title: 'help.weather' },
  { id: 'aide-sauvegarde', title: 'help.saving' },
];

const isOpen = ref(false);
const scroller = ref<HTMLElement | null>(null);
const toc = ref<HTMLElement | null>(null);

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

/** Navigation interne : défilement dans la modale (titre juste sous le sommaire collant), sans changer l'adresse */
const goTo = (id: string) => {
  const box = scroller.value;
  const target = box?.querySelector<HTMLElement>(`#${id}`);
  if (!box || !target) return;
  const offset = (toc.value?.offsetHeight ?? 0) + 12;
  const top = box.scrollTop + target.getBoundingClientRect().top - box.getBoundingClientRect().top - offset;
  box.scrollTo({ top, behavior: 'smooth' });
};

defineExpose({ open, close });
</script>
