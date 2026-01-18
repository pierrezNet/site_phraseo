import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { useFormStore } from './stores/form';
import '@/assets/tailwind.css'; 

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Initialisation des données après l'installation de pinia
const formStore = useFormStore(pinia); // Passer 'pinia' ici sécurise l'appel hors composant
formStore.initializeFormData();

app.mount('#app');