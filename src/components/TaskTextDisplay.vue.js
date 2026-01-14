import { ref, onMounted, computed, watch } from 'vue';
import { useFormStore } from '../stores/form';
import { useLangStore } from '../stores/lang';
import { mockIvaoApi } from '../services/MockApiService';
import { replaceMetarTag } from '../utils/weatherFormatter';
const props = defineProps({
    selectedTaskTexts: {
        type: Array,
        required: true
    }
});
const formStore = useFormStore();
const langStore = useLangStore();
// État pour les données METAR
const metarData = ref(null);
const metarLoading = ref(false);
const metarError = ref(null);
// Utiliser le code ICAO des paramètres avec LFPG comme valeur par défaut
const metarIcao = computed(() => formStore.form.MET || 'LFPG');
// Récupérer les données METAR au chargement du composant et lorsque le code ICAO change
onMounted(async () => {
    await fetchMetar();
});
// Surveiller les changements du code ICAO dans les paramètres
watch(() => formStore.form.MET, async (newValue, oldValue) => {
    if (newValue && newValue !== oldValue) {
        console.log(`Code ICAO changé: ${oldValue} -> ${newValue}`);
        await fetchMetar(newValue);
    }
});
// Fonction pour récupérer les données METAR
async function fetchMetar(icao) {
    if (icao) {
        // metarIcao est maintenant un computed, donc pas besoin de le modifier directement
        // l'icao sera pris en compte lors du prochain rendu
    }
    metarLoading.value = true;
    metarError.value = null;
    try {
        // Utiliser l'API mock pour éviter les problèmes d'authentification
        // Utiliser metarIcao.value pour obtenir la valeur actuelle du computed
        const icaoToUse = icao || metarIcao.value;
        console.log(`Chargement des données METAR pour: ${icaoToUse}`);
        const data = await mockIvaoApi.getMetar(icaoToUse);
        metarData.value = data;
        console.log('METAR data loaded:', data);
    }
    catch (err) {
        console.error('Failed to fetch METAR:', err);
        if (err instanceof Error) {
            metarError.value = err.message;
        }
        else {
            metarError.value = 'Erreur inconnue';
        }
    }
    finally {
        metarLoading.value = false;
    }
}
// Fonction pour transformer les notes entre accolades en infobulles
function processTooltips(text) {
    return text.replace(/\{([^}]+)\}/g, (match, noteContent) => {
        const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
        return `<span class="relative inline-block">
      <button 
        type="button"
        class="text-blue-400 underline decoration-dotted cursor-help focus:outline-none"
        onclick="this.nextElementSibling.classList.toggle('hidden')"
        onblur="setTimeout(() => this.nextElementSibling.classList.add('hidden'), 150)"
      >ℹ️</button>
      <div class="hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 w-max max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg break-words">
        <div class="whitespace-normal">${noteContent}</div>
        <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </span>`;
    });
}
// Ordre hiérarchique des stations selon frequencyLabels
const STATION_HIERARCHY = ['NDEL', 'NGND', 'NTWR', 'NAPP', 'NCTR', 'NUNI'];
const FREQUENCY_TO_STATION = {
    'DEL': 'NDEL',
    'GND': 'NGND',
    'TWR': 'NTWR',
    'APP': 'NAPP',
    'CTR': 'NCTR'
};
// Fonction pour trouver la station de fallback avec une fréquence valide
function findFallbackStation(requestedStation, lang) {
    const startIndex = STATION_HIERARCHY.indexOf(requestedStation);
    if (startIndex === -1)
        return { station: requestedStation, label: requestedStation };
    // Parcourir la hiérarchie à partir de la station demandée
    for (let i = startIndex; i < STATION_HIERARCHY.length; i++) {
        const station = STATION_HIERARCHY[i];
        const frequencyType = Object.keys(FREQUENCY_TO_STATION).find(key => FREQUENCY_TO_STATION[key] === station);
        if (frequencyType && formStore.form[frequencyType] && formStore.form[frequencyType].trim() !== '') {
            const label = formStore.frequencyLabels[station]?.[lang] || station;
            return {
                station,
                label,
                frequency: formStore.form[frequencyType],
                frequencyType
            };
        }
    }
    // Si aucune fréquence n'est trouvée, retourner la station demandée sans fréquence
    const label = formStore.frequencyLabels[requestedStation]?.[lang] || requestedStation;
    return { station: requestedStation, label };
}
// Fonction pour remplacer les placeholders par des valeurs réalistes
function replacePlaceholders(text) {
    const lang = langStore.current;
    // Obtenir l'heure actuelle pour le placeholder [HOU]
    const now = new Date();
    const currentHour = `${now.getUTCHours().toString().padStart(2, '0')} heures ${now.getMinutes().toString().padStart(2, '0')}`;
    // Déterminer le moment de la journée pour [POL]
    const getHeure = () => {
        const dt = new Date();
        return dt.getHours() < 19 ? 'matin' : 'soir';
    };
    const POL = {
        matin: { fr: "bonjour", en: "hello" },
        soir: { fr: "bonsoir", en: "good evening" }
    };
    // D'abord traiter les placeholders entre crochets
    let result = text.replace(/\[(.*?)\]/g, (match, p1) => {
        // Gestion des placeholders spéciaux
        switch (p1) {
            case 'POL':
                return POL[getHeure()][lang];
            case 'HOU':
                return currentHour;
            case 'MET':
                if (metarLoading.value) {
                    return lang === 'fr' ? 'chargement des données météo...' : 'loading weather data...';
                }
                if (metarError.value) {
                    return lang === 'fr' ? `erreur météo: ${metarError.value}` : `weather error: ${metarError.value}`;
                }
                if (metarData.value) {
                    const options = { lang };
                    return replaceMetarTag('[MET]', metarData.value, options);
                }
                return lang === 'fr' ? 'données météo non disponibles' : 'weather data not available';
            case 'RWY':
                return formStore.formatRunway(formStore.form.RWY, lang);
            case 'DEL':
            case 'GND':
            case 'TWR':
            case 'APP':
            case 'CTR': {
                const freq = formStore.form[p1];
                if (!freq || freq.trim() === '') {
                    // Si pas de fréquence, utiliser le système de fallback
                    const requestedStation = FREQUENCY_TO_STATION[p1];
                    const fallback = findFallbackStation(requestedStation, lang);
                    return fallback.frequency
                        ? `${fallback.label}, ${formStore.formatFrequency(fallback.frequency, lang)}`
                        : fallback.label;
                }
                const stationKey = FREQUENCY_TO_STATION[p1];
                const label = formStore.frequencyLabels[stationKey]?.[lang] || p1;
                return `${label}, ${formStore.formatFrequency(freq, lang)}`;
            }
            case 'NDEL':
            case 'NGND':
            case 'NTWR':
            case 'NAPP':
            case 'NCTR': {
                // Pour les stations, on retourne uniquement le nom de la station sans la fréquence
                const stationLabel = formStore.frequencyLabels[p1]?.[lang] || p1;
                return stationLabel;
            }
            default:
                return formStore.form[p1] || match;
        }
    });
    // Ensuite traiter les notes entre accolades pour les transformer en infobulles
    result = processTooltips(result);
    return result;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "m-1 md:space-y-4 md:pr-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "hidden md:block custom-h2" },
});
for (const [text, index] of __VLS_getVForSourceType((__VLS_ctx.selectedTaskTexts))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (index),
        ...{ class: ([
                'w-full',
                'p-4',
                'rounded-md',
                'py-2',
                'mb-4',
                'shadow',
                'transition',
                `bg-${text._color || 'gray'}-200`,
                `hover:bg-${text._color || 'gray'}-300`
            ]) },
    });
    if (text.icon) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "inline-block w-5 h-5 mr-2 align-middle" },
        });
        __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (text.icon) }, null, null);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.replacePlaceholders(text.value)) }, null, null);
}
/** @type {__VLS_StyleScopedClasses['m-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:pr-6']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['md:block']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-h2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['transition']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['align-middle']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            replacePlaceholders: replacePlaceholders,
        };
    },
    props: {
        selectedTaskTexts: {
            type: Array,
            required: true
        }
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    props: {
        selectedTaskTexts: {
            type: Array,
            required: true
        }
    },
});
; /* PartiallyEnd: #4569/main.vue */
