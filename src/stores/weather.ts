import { defineStore } from 'pinia';
import { ref } from 'vue';
import { get } from '../utils/api'; // Importe ton utilitaire fetch

export const useWeatherStore = defineStore('weather', () => {
  const metarData = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<number | null>(null);

  const updateMetar = async (icao: string, force = false) => {
    if (!icao || icao.length < 4) return;

    // Vérification du délai de 30 minutes (30 * 60 * 1000 ms)
    const now = Date.now();
    const isExpired = lastUpdated.value ? (now - lastUpdated.value > 1800000) : true;
 
    // On ne lance l'appel que si c'est expiré, si c'est un nouvel OACI, ou si on force
    if (!isExpired && !force && metarData.value?.icao === icao) {
      console.log("METAR encore frais, pas de mise à jour nécessaire.");
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await get<any>(`https://avwx.rest/api/metar/${icao}`, {
        headers: { 'Authorization': import.meta.env.VITE_AVWX_API_KEY }
      });
      metarData.value = data;
      lastUpdated.value = Date.now(); // On mémorise l'heure du succès
      console.log("METAR mis à jour à :", new Date().toLocaleTimeString());
    } catch (err: any) {
      error.value = err.message;
      console.error("Erreur METAR AVWX:", err);
    } finally {
      loading.value = false;
    }
  };

  return { metarData, loading, error, updateMetar, lastUpdated };
});