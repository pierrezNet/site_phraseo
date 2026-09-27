<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal">
      <!-- Modal Content -->
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center border-b pb-2">
          <h2 class="text-lg font-semibold">J'ai un retour</h2>
          <button @click="close" class="text-gray-600 hover:text-gray-800">
            &times;
          </button>
        </div>

        <!-- État : succès -->
        <div v-if="status === 'success'" class="mt-6 text-center space-y-3">
          <p class="text-3xl">✅</p>
          <p class="font-medium">Merci ! Ton retour a bien été envoyé.</p>
          <p class="text-sm text-gray-500">Il arrive directement sur notre Discord.</p>
          <button @click="close" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Fermer
          </button>
        </div>

        <!-- État : formulaire -->
        <form v-else @submit.prevent="submit" class="mt-4 space-y-4 text-sm">
          <p class="text-gray-600">
            Une erreur de phraséologie, une suggestion, un bug ? Dis-nous tout — aucun compte requis.
          </p>

          <div>
            <label class="block font-medium mb-1 label-field">Type de retour</label>
            <select v-model="type" class="w-full border rounded px-3 py-2">
              <option value="Erreur de phraséologie">Erreur de phraséologie</option>
              <option value="Suggestion / idée">Suggestion / idée</option>
              <option value="Bug technique">Bug technique</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label class="block font-medium mb-1 label-field">Message</label>
            <textarea
              v-model="message"
              required
              rows="5"
              maxlength="1800"
              placeholder="Décris ton retour (tâche concernée, phrase attendue, contexte...)"
              class="w-full border rounded px-3 py-2 resize-y"
            ></textarea>
            <p class="text-xs text-gray-400 text-right">{{ message.length }} / 1800</p>
          </div>

          <div>
            <label class="block font-medium mb-1 label-field">Contact (optionnel)</label>
            <input
              v-model="contact"
              type="text"
              maxlength="120"
              placeholder="Email ou pseudo Discord, si tu veux une réponse"
              class="w-full border rounded px-3 py-2"
            />
          </div>

          <p v-if="status === 'error'" class="text-red-600 text-sm">
            L'envoi a échoué. Réessaie, ou rejoins-nous directement sur Discord.
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="close" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
              Annuler
            </button>
            <button
              type="submit"
              :disabled="status === 'sending' || !message.trim()"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ status === 'sending' ? 'Envoi…' : 'Envoyer' }}
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
import { postJson } from '../utils/api';
import { API_BASE } from '../utils/relay';

type Status = 'idle' | 'sending' | 'success' | 'error';

const formStore = useFormStore();
const langStore = useLangStore();

const isOpen = ref(false);
const status = ref<Status>('idle');
const type = ref('Erreur de phraséologie');
const message = ref('');
const contact = ref('');

const open = () => {
  // Réinitialise l'état à chaque ouverture
  status.value = 'idle';
  message.value = '';
  contact.value = '';
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

  // Le relais construit le message Discord ; on n'envoie que les champs utiles.
  // Le contexte technique (mode, niveau, langue) facilite le tri.
  try {
    await postJson(`${API_BASE}/feedback`, {
      type: type.value,
      message: message.value.slice(0, 1800),
      contact: contact.value.trim(),
      mode: formStore.mode,
      level: formStore.form.LEVEL || '',
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
