import type { Ref } from 'vue';
interface Modal {
    open: () => void;
    close: () => void;
}
declare const _default: import("vue").DefineComponent<{}, {
    aideModal: Ref<Modal | null, Modal | null>;
    parametresModal: Ref<Modal | null, Modal | null>;
    aboutModal: Ref<Modal | null, Modal | null>;
    openModal: (modalName: string) => void;
    selectedTaskTexts: Ref<string[], string[]>;
    updateSelectedTaskTexts: (texts: string[]) => void;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
    Navbar: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    Tabs: import("vue").DefineComponent<{}, {}, any>;
    TaskTextDisplay: import("vue").DefineComponent<{}, {}, any>;
    AideModal: import("vue").DefineComponent<{}, {
        isOpen: Ref<boolean, boolean>;
        open: () => void;
        close: () => void;
    }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    ParametresModal: import("vue").DefineComponent<{}, {
        isOpen: Ref<boolean, boolean>;
        formStore: import("pinia").Store<"form", import("./stores/form.js").FormStoreState, {
            isFrequencyType: () => (key: string) => key is import("./stores/form.js").FrequencyType;
            isStationType: () => (key: string) => key is import("./stores/form.js").StationType;
        }, {
            updateFormData(payload: import("./stores/form.js").FormData): void;
            saveToLocalStorage(): void;
            syncFrequencyLabels(): void;
            initializeFormData(): void;
            isValidFormData(data: any): data is import("./stores/form.js").FormData;
            getFrequencyLabel(key: string, lang?: import("./stores/form.js").Language): string;
            getStationLabel(stationType: import("./stores/form.js").StationType, lang: import("./stores/form.js").Language): string;
            getFrequencyTypeFromStation(stationType: import("./stores/form.js").StationType): import("./stores/form.js").FrequencyType | null;
            getFormattedFrequency(frequency: string, lang: import("./stores/form.js").Language): string;
            formatFrequency(freq: string, lang?: import("./stores/form.js").Language): string;
            cleanFrequencyInput(freq: string): string;
            isValidFrequency(freq: string): boolean;
            isFrequencyTooLarge(freq: string): boolean;
            formatValidFrequency(cleanFreq: string, lang: import("./stores/form.js").Language): string;
            formatFrequencyFrench(integerPart: string, decimalPart: string, decimalValue: number): string;
            formatFrequencyEnglish(integerPart: string, decimalPart: string, decimalValue: number): string;
            formatRunway(runway: string, lang?: import("./stores/form.js").Language): string;
        }>;
        open: () => void;
        close: () => void;
        clearInput: (field: keyof import("./stores/form.js").FormData) => void;
        updateForm: () => void;
    }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    AboutModal: import("vue").DefineComponent<{}, {
        isOpen: Ref<boolean, boolean>;
        open: () => void;
        close: () => void;
    }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
