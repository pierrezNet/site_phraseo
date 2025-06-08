// src/stores/lang.ts
import { defineStore } from 'pinia';
export const useLangStore = defineStore('lang', {
    state: () => ({
        current: 'fr' // langue par défaut
    }),
    actions: {
        changeLanguage(lang) {
            this.current = lang;
            localStorage.setItem('lang', lang);
        },
        loadLanguage() {
            const lang = localStorage.getItem('lang');
            if (lang) {
                this.current = lang;
            }
        }
    }
});
