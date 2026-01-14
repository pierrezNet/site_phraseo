declare const _default: import("vue").DefineComponent<{}, {
    isOpen: import("vue").Ref<boolean, boolean>;
    formStore: import("pinia").Store<"form", import("../stores/form").FormStoreState, {
        isFrequencyType: () => (key: string) => key is import("../stores/form").FrequencyType;
        isStationType: () => (key: string) => key is import("../stores/form").StationType;
    }, {
        updateFormData(payload: import("../stores/form").FormData): void;
        saveToLocalStorage(): void;
        syncFrequencyLabels(): void;
        initializeFormData(): void;
        isValidFormData(data: any): data is import("../stores/form").FormData;
        getFrequencyLabel(key: string, lang?: import("../stores/form").Language): string;
        getStationLabel(stationType: import("../stores/form").StationType, lang: import("../stores/form").Language): string;
        getFrequencyTypeFromStation(stationType: import("../stores/form").StationType): import("../stores/form").FrequencyType | null;
        getFormattedFrequency(frequency: string, lang: import("../stores/form").Language): string;
        formatFrequency(freq: string, lang?: import("../stores/form").Language): string;
        cleanFrequencyInput(freq: string): string;
        isValidFrequency(freq: string): boolean;
        isFrequencyTooLarge(freq: string): boolean;
        formatValidFrequency(cleanFreq: string, lang: import("../stores/form").Language): string;
        formatFrequencyFrench(integerPart: string, decimalPart: string, decimalValue: number): string;
        formatFrequencyEnglish(integerPart: string, decimalPart: string, decimalValue: number): string;
        formatRunway(runway: string, lang?: import("../stores/form").Language): string;
    }>;
    open: () => void;
    close: () => void;
    clearInput: (field: keyof import("../stores/form").FormData) => void;
    updateForm: () => void;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
