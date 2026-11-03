<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal">
      <!-- Modal Content -->
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center border-b pb-2">
          <h2 class="text-lg font-semibold">{{ t('feedback.title') }}</h2>
          <button @click="close" class="text-gray-600 hover:text-gray-800" :aria-label="t('common.close')">
            &times;
          </button>
        </div>

        <!-- État : succès -->
        <div v-if="status === 'success'" class="mt-6 text-center space-y-3">
          <p class="text-3xl">✅</p>
          <p class="font-medium">{{ t('feedback.thanks') }}</p>
          <p class="text-sm text-gray-500">{{ before('feedback.published') }}<a href="https://avrobb.org/forum/4-phraseologie-aeronautique" target="_blank" rel="noopener noreferrer" class="underline">{{ t('feedback.forumLink') }}</a>{{ after('feedback.published') }}</p>
          <button @click="close" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {{ t('common.close') }}
          </button>
        </div>

        <!-- État : formulaire -->
        <form v-else @submit.prevent="submit" class="mt-4 space-y-4 text-sm">
          <p class="text-gray-600">
            {{ t('feedback.intro') }}
          </p>

          <div>
            <label for="feedback-type" class="block font-medium mb-1 label-field">{{ t('feedback.type') }}</label>
            <select id="feedback-type" v-model="type" class="w-full border rounded px-3 py-2">
              <!-- Valeur envoyée au forum : toujours le libellé français (tri des retours) -->
              <option v-for="key in TYPES" :key="key" :value="fr[key]">{{ t(key) }}</option>
            </select>
          </div>

          <div>
            <label for="feedback-message" class="block font-medium mb-1 label-field">{{ t('feedback.message') }}</label>
            <textarea
              id="feedback-message"
              v-model="message"
              required
              rows="5"
              maxlength="1800"
              :placeholder="t('feedback.messagePlaceholder')"
              class="w-full border rounded px-3 py-2 resize-y"
            ></textarea>
            <p class="text-xs text-gray-400 text-right">{{ message.length }} / 1800</p>
          </div>

          <div>
            <label for="feedback-pseudo" class="block font-medium mb-1 label-field">{{ t('feedback.pseudo') }}</label>
            <input
              id="feedback-pseudo"
              v-model="pseudo"
              type="text"
              maxlength="40"
              autocomplete="nickname"
              :placeholder="t('feedback.pseudoPlaceholder')"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label for="feedback-contact" class="block font-medium mb-1 label-field">{{ t('feedback.contact') }}</label>
            <input
              id="feedback-contact"
              v-model="contact"
              type="text"
              maxlength="120"
              autocomplete="email"
              :placeholder="t('feedback.contactPlaceholder')"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <p v-if="status === 'error'" class="text-red-600 text-sm">
            {{ before('feedback.error') }}<a href="https://avrobb.org/forum/4-phraseologie-aeronautique" target="_blank" rel="noopener noreferrer" class="underline">{{ t('feedback.errorForum') }}</a>{{ after('feedback.error') }}
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="close" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="status === 'sending' || !message.trim()"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ t(status === 'sending' ? 'feedback.sending' : 'feedback.send') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { useI18n, type MessageKey } from '../i18n';
import { fr } from '../i18n/fr';
import { postJson } from '../utils/api';
import { API_BASE } from '../utils/relay';

type Status = 'idle' | 'sending' | 'success' | 'error';

const formStore = useFormStore();
const langStore = useLangStore();
const { t } = useI18n();

const TYPES: MessageKey[] = ['feedback.type.phraseology', 'feedback.type.idea', 'feedback.type.bug', 'feedback.type.other'];

/** Texte avant / après le lien `{forum}` d'un message */
const before = (key: MessageKey) => t(key).split('{forum}')[0];
const after = (key: MessageKey) => t(key).split('{forum}')[1] ?? '';

const isOpen = ref(false);
const status = ref<Status>('idle');
const type = ref<string>(fr['feedback.type.phraseology']);
const message = ref('');
const contact = ref('');
const pseudo = ref('');

const open = () => {
  // Réinitialise l'état à chaque ouverture
  status.value = 'idle';
  message.value = '';
  contact.value = '';
  pseudo.value = '';
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

const submit = async () => {
  if (!message.value.trim()) return;

  if (!API_BASE) {
    console.warn('VITE_API_BASE manquant : feedback non envoyé.');
    status.value = 'error';
    return;
  }

  status.value = 'sending';

  // Le relais transmet au forum (sujet privé, contact envoyé aux administrateurs seulement) ; on n'envoie que les champs utiles.
  // Le contexte technique (mode, niveau, langue) facilite le tri.
  try {
    await postJson(`${API_BASE}/feedback`, {
      type: type.value,
      message: message.value.slice(0, 1800),
      contact: contact.value.trim(),
      pseudo: pseudo.value.trim(),
      mode: formStore.mode,
      level: formStore.form.LEVEL || '',
      // Langue des échanges : celle des textes signalés
      lang: langStore.current,
    });
    status.value = 'success';
  } catch (err) {
    console.error('Échec envoi feedback :', err);
    status.value = 'error';
  }
};

defineExpose({ open, close });
</script>

<style scoped>
/* Styles spécifiques via les thèmes VFR/IFR globaux (App.vue) */
</style>
