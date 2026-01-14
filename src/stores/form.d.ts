export type Language = 'fr' | 'en';
export type FrequencyType = 'DEL' | 'GND' | 'TWR' | 'APP' | 'CTR';
export type StationType = 'NDEL' | 'NGND' | 'NTWR' | 'NAPP' | 'NCTR';
export type RunwaySuffix = 'L' | 'R' | 'C';
export interface FormData {
    [key: string]: string;
    FIR: string;
    DEP: string;
    POS: string;
    ARR: string;
    COM: string;
    CAL: string;
    CAA: string;
    INF: string;
    WPT: string;
    STA: string;
    VOI: string;
    HLD: string;
    QNH: string;
    RWY: string;
    SQU: string;
    NIV: string;
    VIT: string;
    CAP: string;
    DEL: string;
    GND: string;
    TWR: string;
    APP: string;
    CTR: string;
    NDEL: string;
    NGND: string;
    NTWR: string;
    NAPP: string;
    NCTR: string;
}
export interface FrequencyLabel {
    frequency: string;
    fr: string;
    en: string;
}
export interface FrequencyLabels {
    [key: string]: FrequencyLabel;
}
export interface FormStoreState {
    form: FormData;
    frequencyLabels: FrequencyLabels;
}
export declare const useFormStore: import("pinia").StoreDefinition<"form", FormStoreState, {
    isFrequencyType: () => (key: string) => key is FrequencyType;
    isStationType: () => (key: string) => key is StationType;
}, {
    /**
     * Updates form data and synchronizes frequency labels
     */
    updateFormData(payload: FormData): void;
    /**
     * Saves form data to localStorage with error handling
     */
    saveToLocalStorage(): void;
    /**
     * Synchronizes frequency labels with form data using mapping
     */
    syncFrequencyLabels(): void;
    /**
     * Initializes form data from localStorage with error handling
     */
    initializeFormData(): void;
    /**
     * Validates form data structure
     */
    isValidFormData(data: any): data is FormData;
    /**
     * Gets frequency label with improved type safety and error handling
     */
    getFrequencyLabel(key: string, lang?: Language): string;
    /**
     * Gets station label with frequency
     */
    getStationLabel(stationType: StationType, lang: Language): string;
    /**
     * Maps station type to frequency type
     */
    getFrequencyTypeFromStation(stationType: StationType): FrequencyType | null;
    /**
     * Gets formatted frequency with error handling
     */
    getFormattedFrequency(frequency: string, lang: Language): string;
    /**
     * Formats frequency with improved error handling and validation
     */
    formatFrequency(freq: string, lang?: Language): string;
    /**
     * Cleans frequency input by removing unwanted characters
     */
    cleanFrequencyInput(freq: string): string;
    /**
     * Validates frequency format
     */
    isValidFrequency(freq: string): boolean;
    /**
     * Checks if frequency is too large
     */
    isFrequencyTooLarge(freq: string): boolean;
    /**
     * Formats a valid frequency string
     */
    formatValidFrequency(cleanFreq: string, lang: Language): string;
    /**
     * Formats frequency in French
     */
    formatFrequencyFrench(integerPart: string, decimalPart: string, decimalValue: number): string;
    /**
     * Formats frequency in English
     */
    formatFrequencyEnglish(integerPart: string, decimalPart: string, decimalValue: number): string;
    /**
     * Formats runway designation in French
     * Converts L/R/C to Gauche/Droite/Centrale
     * Example: "26L" becomes "26 Gauche"
     */
    formatRunway(runway: string, lang?: Language): string;
}>;
