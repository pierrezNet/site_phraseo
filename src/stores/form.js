import { defineStore } from 'pinia';
// Constants for better maintainability
const FREQUENCY_TYPES = ['DEL', 'GND', 'TWR', 'APP', 'CTR'];
const STATION_TYPES = ['NDEL', 'NGND', 'NTWR', 'NAPP', 'NCTR'];
// Frequency to station mapping for cleaner code
const FREQUENCY_TO_STATION_MAP = {
    DEL: 'NDEL',
    GND: 'NGND',
    TWR: 'NTWR',
    APP: 'NAPP',
    CTR: 'NCTR'
};
// Runway suffix translations
const RUNWAY_TRANSLATIONS = {
    fr: {
        'L': 'Gauche',
        'R': 'Droite',
        'C': 'Centrale'
    },
    en: {
        'L': 'Left',
        'R': 'Right',
        'C': 'Center'
    }
};
// Error messages by language
const ERROR_MESSAGES = {
    fr: {
        INVALID_INPUT: 'ENTRÉE INVALIDE',
        TOO_LARGE: 'TROP GRAND'
    },
    en: {
        INVALID_INPUT: 'INVALID INPUT',
        TOO_LARGE: 'TOO LARGE'
    }
};
// Validation constants
const MAX_FREQUENCY_LENGTH = 7;
const DECIMAL_PRECISION = 1000;
export const useFormStore = defineStore('form', {
    state: () => ({
        form: {
            FIR: 'Paris',
            DEP: 'Orly',
            POS: 'D2',
            ARR: 'Strasbourg',
            COM: 'Air Europe',
            CAL: 'AEL001',
            CAA: 'Air Europe 01',
            INF: 'Lima',
            WPT: 'BUBLI',
            STA: 'Bubli_3_Papa',
            VOI: 'W_3 W_4',
            HLD: 'Whiskey 41',
            QNH: '1013',
            RWY: '26L',
            SQU: '1000',
            NIV: '110',
            VIT: '360',
            CAP: '360',
            DEL: '121.050',
            GND: '121.825',
            TWR: '118.700',
            APP: '123.875',
            CTR: '125.100',
            NDEL: "Prévol",
            NGND: "Sol",
            NTWR: "Tour",
            NAPP: "Approche",
            NCTR: "Contrôle"
        },
        frequencyLabels: {
            NDEL: { frequency: '', fr: "Prévol", en: "Delivery" },
            NGND: { frequency: '', fr: "Sol", en: "Ground" },
            NTWR: { frequency: '', fr: "Tour", en: "Tower" },
            NAPP: { frequency: '', fr: "Approche", en: "Approach" },
            NCTR: { frequency: '', fr: "Contrôle", en: "Control" },
            NUNI: { frequency: '122.800', fr: "UNICOM", en: "UNICOM" }
        }
    }),
    getters: {
        // Getter for type-safe access to frequency types
        isFrequencyType: () => (key) => {
            return FREQUENCY_TYPES.includes(key);
        },
        // Getter for type-safe access to station types
        isStationType: () => (key) => {
            return STATION_TYPES.includes(key);
        }
    },
    actions: {
        /**
         * Updates form data and synchronizes frequency labels
         */
        updateFormData(payload) {
            this.form = payload;
            this.saveToLocalStorage();
            this.syncFrequencyLabels();
        },
        /**
         * Saves form data to localStorage with error handling
         */
        saveToLocalStorage() {
            try {
                localStorage.setItem('formData', JSON.stringify(this.form));
            }
            catch (error) {
                console.error('Failed to save form data to localStorage:', error);
            }
        },
        /**
         * Synchronizes frequency labels with form data using mapping
         */
        syncFrequencyLabels() {
            Object.entries(FREQUENCY_TO_STATION_MAP).forEach(([freqType, stationType]) => {
                if (this.frequencyLabels[stationType]) {
                    this.frequencyLabels[stationType].frequency = this.form[freqType];
                }
            });
        },
        /**
         * Initializes form data from localStorage with error handling
         */
        initializeFormData() {
            try {
                const saved = localStorage.getItem('formData');
                if (saved) {
                    const parsedData = JSON.parse(saved);
                    // Validate that parsed data has expected structure
                    if (this.isValidFormData(parsedData)) {
                        this.form = parsedData;
                        this.syncFrequencyLabels();
                    }
                }
            }
            catch (error) {
                console.error('Failed to load form data from localStorage:', error);
            }
        },
        /**
         * Validates form data structure
         */
        isValidFormData(data) {
            return data && typeof data === 'object' && 'FIR' in data;
        },
        /**
         * Gets frequency label with improved type safety and error handling
         */
        getFrequencyLabel(key, lang = 'fr') {
            try {
                // Handle frequency types (DEL, GND, etc.)
                if (this.isFrequencyType(key)) {
                    return this.getFormattedFrequency(this.form[key], lang);
                }
                // Handle station types (NDEL, NGND, etc.)
                if (this.isStationType(key)) {
                    return this.getStationLabel(key, lang);
                }
                return '';
            }
            catch (error) {
                console.error(`Error getting frequency label for key ${key}:`, error);
                return '';
            }
        },
        /**
         * Gets station label with frequency
         */
        getStationLabel(stationType, lang) {
            const frequencyLabel = this.frequencyLabels[stationType];
            if (!frequencyLabel)
                return stationType;
            const label = frequencyLabel[lang] || stationType;
            const frequencyType = this.getFrequencyTypeFromStation(stationType);
            const frequency = frequencyType ? this.form[frequencyType] : '';
            return frequency
                ? `${label}, ${this.formatFrequency(frequency, lang)}`
                : label;
        },
        /**
         * Maps station type to frequency type
         */
        getFrequencyTypeFromStation(stationType) {
            const entry = Object.entries(FREQUENCY_TO_STATION_MAP)
                .find(([, station]) => station === stationType);
            return entry ? entry[0] : null;
        },
        /**
         * Gets formatted frequency with error handling
         */
        getFormattedFrequency(frequency, lang) {
            return frequency ? this.formatFrequency(frequency, lang) : '';
        },
        /**
         * Formats frequency with improved error handling and validation
         */
        formatFrequency(freq, lang = 'fr') {
            if (!freq || typeof freq !== 'string') {
                return ERROR_MESSAGES[lang].INVALID_INPUT;
            }
            const cleanFreq = this.cleanFrequencyInput(freq);
            if (!this.isValidFrequency(cleanFreq)) {
                return ERROR_MESSAGES[lang].INVALID_INPUT;
            }
            if (this.isFrequencyTooLarge(cleanFreq)) {
                return ERROR_MESSAGES[lang].TOO_LARGE;
            }
            return this.formatValidFrequency(cleanFreq, lang);
        },
        /**
         * Cleans frequency input by removing unwanted characters
         */
        cleanFrequencyInput(freq) {
            return freq.replace(/[, ]/g, '');
        },
        /**
         * Validates frequency format
         */
        isValidFrequency(freq) {
            return !isNaN(parseFloat(freq)) && freq.length > 0;
        },
        /**
         * Checks if frequency is too large
         */
        isFrequencyTooLarge(freq) {
            const decimalIndex = freq.indexOf('.');
            return decimalIndex === -1 || decimalIndex > MAX_FREQUENCY_LENGTH;
        },
        /**
         * Formats a valid frequency string
         */
        formatValidFrequency(cleanFreq, lang) {
            const parts = cleanFreq.split('.');
            const integerPart = parts[0];
            const decimalPart = parts[1] || '0';
            const decimalValue = parseInt(decimalPart) / DECIMAL_PRECISION;
            return lang === 'fr'
                ? this.formatFrequencyFrench(integerPart, decimalPart, decimalValue)
                : this.formatFrequencyEnglish(integerPart, decimalPart, decimalValue);
        },
        /**
         * Formats frequency in French
         */
        formatFrequencyFrench(integerPart, decimalPart, decimalValue) {
            let result = `${integerPart} décimale `;
            if (decimalValue === 0 || parseInt(decimalPart) % 100 === 0) {
                result += 'unité';
            }
            else if (decimalValue > 0.009 && decimalValue < 0.091) {
                result += `0_${Math.round(decimalValue * DECIMAL_PRECISION)}`;
            }
            else {
                result += decimalPart;
            }
            return result.replace(/\s+/g, ' ');
        },
        /**
         * Formats frequency in English
         */
        formatFrequencyEnglish(integerPart, decimalPart, decimalValue) {
            const integerDigits = integerPart.split('');
            const decimalDigits = decimalPart.split('');
            let result = `${integerDigits[0]}_${integerDigits[1]}_${integerDigits[2]} decimal `;
            if (decimalValue === 0) {
                result += '0';
            }
            else if (parseInt(decimalPart) % 100 === 0) {
                result += Math.round(decimalValue * 10);
            }
            else if (decimalValue > 0.009 && decimalValue < 0.091) {
                result += `0_${decimalDigits[1]}_${decimalDigits[2]}`;
            }
            else {
                result += `${decimalDigits[0]}_${decimalDigits[1]}_${decimalDigits[2]}`;
            }
            return result;
        },
        /**
         * Formats runway designation in French
         * Converts L/R/C to Gauche/Droite/Centrale
         * Example: "26L" becomes "26 Gauche"
         */
        formatRunway(runway, lang = 'fr') {
            if (!runway || typeof runway !== 'string') {
                return runway || '';
            }
            // Extract number and suffix (L, R, C)
            const match = runway.match(/^(\d{1,2})([LRC]?)$/i);
            if (!match) {
                return runway; // Return original if format doesn't match
            }
            const [, number, suffix] = match;
            if (!suffix) {
                return number; // Just the number if no suffix
            }
            const suffixUpper = suffix.toUpperCase();
            const translations = RUNWAY_TRANSLATIONS[lang];
            return `${number} ${translations[suffixUpper] || suffix}`;
        }
    }
});
