import { defineStore } from 'pinia'

// Define specific types for better type safety
export type Language = 'fr' | 'en'
export type FrequencyType = 'DEL' | 'GND' | 'TWR' | 'APP' | 'CTR'
export type StationType = 'NDEL' | 'NGND' | 'NTWR' | 'NAPP' | 'NCTR'
export type RunwaySuffix = 'L' | 'R' | 'C'

export interface FormData {
  [key: string]: string
  FIR: string
  DEP: string
  POS: string
  ARR: string
  COM: string
  CAL: string
  CAA: string
  INF: string
  WPT: string
  STA: string
  VOI: string
  HLD: string
  QNH: string
  RWY: string
  SQU: string
  NIV: string
  VIT: string
  CAP: string
  DEL: string
  GND: string
  TWR: string
  APP: string
  CTR: string
  NDEL: string
  NGND: string
  NTWR: string
  NAPP: string
  NCTR: string
}

export interface FrequencyLabel {
  frequency: string
  fr: string
  en: string
}

export interface FrequencyLabels {
  [key: string]: FrequencyLabel
}

export interface FormStoreState {
  form: FormData
  frequencyLabels: FrequencyLabels
}

// Constants for better maintainability
const FREQUENCY_TYPES: readonly FrequencyType[] = ['DEL', 'GND', 'TWR', 'APP', 'CTR'] as const
const STATION_TYPES: readonly StationType[] = ['NDEL', 'NGND', 'NTWR', 'NAPP', 'NCTR'] as const

// Frequency to station mapping for cleaner code
const FREQUENCY_TO_STATION_MAP: Record<FrequencyType, StationType> = {
  DEL: 'NDEL',
  GND: 'NGND',
  TWR: 'NTWR',
  APP: 'NAPP',
  CTR: 'NCTR'
} as const

// Runway suffix translations
const RUNWAY_TRANSLATIONS = {
  fr: {
    'L': 'Gauche',
    'R': 'Droite', 
    'C': 'Centrale'
  } as Record<RunwaySuffix, string>,
  en: {
    'L': 'Left',
    'R': 'Right',
    'C': 'Center'
  } as Record<RunwaySuffix, string>
} as const

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
} as const

// Validation constants
const MAX_FREQUENCY_LENGTH = 7
const DECIMAL_PRECISION = 1000

export const useFormStore = defineStore('form', {
  state: (): FormStoreState => ({
    form: {
      FIR: 'Paris',
      DEP: 'Orly',
      POS: 'D2',
      ARR: 'Strasbourg',
      COM: 'Air Europe',
      CAL: 'AEL001',
      CAA: 'Air Europe 01',
      INF: 'L',
      WPT: 'BUBLI',
      STA: 'Bubli_3_Papa',
      VOI: 'W3 W4',
      HLD: 'W41',
      MET: 'LFPO',
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
    isFrequencyType: () => (key: string): key is FrequencyType => {
      return FREQUENCY_TYPES.includes(key as FrequencyType)
    },

    // Getter for type-safe access to station types
    isStationType: () => (key: string): key is StationType => {
      return STATION_TYPES.includes(key as StationType)
    }
  },

  actions: {
    /**
     * Updates form data and synchronizes frequency labels
     */
    updateFormData(payload: FormData): void {
      this.form = payload
      this.saveToLocalStorage()
      this.syncFrequencyLabels()
    },

    /**
     * Saves form data to localStorage with error handling
     */
    saveToLocalStorage(): void {
      try {
        localStorage.setItem('formData', JSON.stringify(this.form))
      } catch (error) {
        console.error('Failed to save form data to localStorage:', error)
      }
    },

    /**
     * Synchronizes frequency labels with form data using mapping
     */
    syncFrequencyLabels(): void {
      Object.entries(FREQUENCY_TO_STATION_MAP).forEach(([freqType, stationType]) => {
        if (this.frequencyLabels[stationType]) {
          this.frequencyLabels[stationType].frequency = this.form[freqType]
        }
      })
    },

    /**
     * Initializes form data from localStorage with error handling
     */
    initializeFormData(): void {
      try {
        const saved = localStorage.getItem('formData')
        if (saved) {
          const parsedData = JSON.parse(saved)
          // Validate that parsed data has expected structure
          if (this.isValidFormData(parsedData)) {
            this.form = parsedData
            this.syncFrequencyLabels()
          }
        }
      } catch (error) {
        console.error('Failed to load form data from localStorage:', error)
      }
    },

    /**
     * Validates form data structure
     */
    isValidFormData(data: any): data is FormData {
      return data && typeof data === 'object' && 'FIR' in data
    },

    /**
     * Gets frequency label with improved type safety and error handling
     */
    getFrequencyLabel(key: string, lang: Language = 'fr'): string {
      try {
        // Handle frequency types (DEL, GND, etc.)
        if (this.isFrequencyType(key)) {
          return this.getFormattedFrequency(this.form[key], lang)
        }

        // Handle station types (NDEL, NGND, etc.)
        if (this.isStationType(key)) {
          return this.getStationLabel(key, lang)
        }

        return ''
      } catch (error) {
        console.error(`Error getting frequency label for key ${key}:`, error)
        return ''
      }
    },

    /**
     * Gets station label with frequency
     */
    getStationLabel(stationType: StationType, lang: Language): string {
      const frequencyLabel = this.frequencyLabels[stationType]
      if (!frequencyLabel) return stationType

      const label = frequencyLabel[lang] || stationType
      const frequencyType = this.getFrequencyTypeFromStation(stationType)
      const frequency = frequencyType ? this.form[frequencyType] : ''

      return frequency 
        ? `${label}, ${this.formatFrequency(frequency, lang)}`
        : label
    },

    /**
     * Maps station type to frequency type
     */
    getFrequencyTypeFromStation(stationType: StationType): FrequencyType | null {
      const entry = Object.entries(FREQUENCY_TO_STATION_MAP)
        .find(([, station]) => station === stationType)
      return entry ? entry[0] as FrequencyType : null
    },

    /**
     * Gets formatted frequency with error handling
     */
    getFormattedFrequency(frequency: string, lang: Language): string {
      return frequency ? this.formatFrequency(frequency, lang) : ''
    },

    /**
     * Formats frequency with improved error handling and validation
     */
    formatFrequency(freq: string, lang: Language = 'fr'): string {
      if (!freq || typeof freq !== 'string') {
        return ERROR_MESSAGES[lang].INVALID_INPUT
      }

      const cleanFreq = this.cleanFrequencyInput(freq)
      
      if (!this.isValidFrequency(cleanFreq)) {
        return ERROR_MESSAGES[lang].INVALID_INPUT
      }

      if (this.isFrequencyTooLarge(cleanFreq)) {
        return ERROR_MESSAGES[lang].TOO_LARGE
      }

      return this.formatValidFrequency(cleanFreq, lang)
    },

    /**
     * Cleans frequency input by removing unwanted characters
     */
    cleanFrequencyInput(freq: string): string {
      return freq.replace(/[, ]/g, '')
    },

    /**
     * Validates frequency format
     */
    isValidFrequency(freq: string): boolean {
      return !isNaN(parseFloat(freq)) && freq.length > 0
    },

    /**
     * Checks if frequency is too large
     */
    isFrequencyTooLarge(freq: string): boolean {
      const decimalIndex = freq.indexOf('.')
      return decimalIndex === -1 || decimalIndex > MAX_FREQUENCY_LENGTH
    },

    /**
     * Formats a valid frequency string
     */
    formatValidFrequency(cleanFreq: string, lang: Language): string {
      const parts = cleanFreq.split('.')
      const integerPart = parts[0]
      const decimalPart = parts[1] || '0'
      const decimalValue = parseInt(decimalPart) / DECIMAL_PRECISION

      return lang === 'fr' 
        ? this.formatFrequencyFrench(integerPart, decimalPart, decimalValue)
        : this.formatFrequencyEnglish(integerPart, decimalPart, decimalValue)
    },

    /**
     * Formats frequency in French
     */
    formatFrequencyFrench(integerPart: string, decimalPart: string, decimalValue: number): string {
      let result = `${integerPart} décimale `

      if (decimalValue === 0 || parseInt(decimalPart) % 100 === 0) {
        result += 'unité'
      } else if (decimalValue > 0.009 && decimalValue < 0.091) {
        result += `0_${Math.round(decimalValue * DECIMAL_PRECISION)}`
      } else {
        result += decimalPart
      }

      return result.replace(/\s+/g, ' ')
    },

    /**
     * Formats frequency in English
     */
    formatFrequencyEnglish(integerPart: string, decimalPart: string, decimalValue: number): string {
      const integerDigits = integerPart.split('')
      const decimalDigits = decimalPart.split('')

      let result = `${integerDigits[0]}_${integerDigits[1]}_${integerDigits[2]} decimal `

      if (decimalValue === 0) {
        result += '0'
      } else if (parseInt(decimalPart) % 100 === 0) {
        result += Math.round(decimalValue * 10)
      } else if (decimalValue > 0.009 && decimalValue < 0.091) {
        result += `0_${decimalDigits[1]}_${decimalDigits[2]}`
      } else {
        result += `${decimalDigits[0]}_${decimalDigits[1]}_${decimalDigits[2]}`
      }

      return result
    },

    /**
     * Formats runway designation in French
     * Converts L/R/C to Gauche/Droite/Centrale
     * Example: "26L" becomes "26 Gauche"
     */
    formatRunway(runway: string, lang: Language = 'fr'): string {
      if (!runway || typeof runway !== 'string') {
        return runway || ''
      }

      // Extract number and suffix (L, R, C)
      const match = runway.match(/^(\d{1,2})([LRC]?)$/i)
      if (!match) {
        return runway // Return original if format doesn't match
      }

      const [, number, suffix] = match
      
      if (!suffix) {
        return number // Just the number if no suffix
      }

      const suffixUpper = suffix.toUpperCase() as RunwaySuffix
      const translations = RUNWAY_TRANSLATIONS[lang]
      
      return `${number} ${translations[suffixUpper] || suffix}`
    }
  }
})
