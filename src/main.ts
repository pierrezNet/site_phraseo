import { createApp } from 'vue';
import { createPinia } from 'pinia'
import App from './App.vue';
import { useFormStore } from './stores/form';
import '@/assets/tailwind.css'; 

const app = createApp(App);

app.use(createPinia())

// Initialiser les données du formulaire
const formStore = useFormStore();
formStore.initializeFormData();

app.mount('#app')
