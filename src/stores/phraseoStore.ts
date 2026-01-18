import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// On définit l'interface pour une phrase aéronautique
interface Phrase {
  id: number;
  context: string; // ex: "Approche", "Tour"
  french: string;
  english: string;
  category: 'VFR' | 'IFR';
}

export const usePhraseoStore = defineStore('phraseo', () => {
  // --- STATE ---
  const phrases = ref<Phrase[]>([]);
  const searchQuery = ref('');
  const currentLanguage = ref<'FR' | 'EN'>('FR');

  // --- GETTERS (Computed) ---
  const filteredPhrases = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return phrases.value.filter(p => 
      p.french.toLowerCase().includes(query) || 
      p.english.toLowerCase().includes(query) ||
      p.context.toLowerCase().includes(query)
    );
  });

  // --- ACTIONS ---
  function setPhrases(newPhrases: Phrase[]) {
    phrases.value = newPhrases;
  }

  function toggleLanguage() {
    currentLanguage.value = currentLanguage.value === 'FR' ? 'EN' : 'FR';
  }

  return { 
    phrases, 
    searchQuery, 
    currentLanguage, 
    filteredPhrases, 
    setPhrases, 
    toggleLanguage 
  };
});