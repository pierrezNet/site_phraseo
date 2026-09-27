import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { get } from '../utils/api';
import { metarFields, type Metar } from '../types/metar';
import { API_BASE } from '../utils/relay';

const METAR_TTL_MS = 30 * 60 * 1000;

export const useWeatherStore = defineStore('weather', () => {
  const metarData = ref<Metar | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<number | null>(null);
  const lastIcao = ref<string | null>(null);

  /** QNH du METAR sous forme de chaîne, ou null si indisponible */
  const metarQnh = computed(() => {
    const value = metarData.value ? metarFields(metarData.value).altimeter?.value : null;
    return value ? String(value) : null;
  });

  const updateMetar = async (icao: string, force = false) => {
    if (!/^[A-Za-z]{4}$/.test(icao)) return;
    const code = icao.toUpperCase();

    // On ne relance l'appel que si le METAR a expiré, si l'OACI change, ou si on force
    const isExpired = !lastUpdated.value || Date.now() - lastUpdated.value > METAR_TTL_MS;
    if (!isExpired && !force && lastIcao.value === code) return;

    if (!API_BASE) {
      error.value = 'VITE_API_BASE manquant : METAR indisponible.';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      metarData.value = await get<Metar>(`${API_BASE}/metar/${code}`);
      lastIcao.value = code;
      lastUpdated.value = Date.now();
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      console.error("Erreur METAR:", err);
    } finally {
      loading.value = false;
    }
  };

  return { metarData, metarQnh, loading, error, updateMetar, lastUpdated };
});
