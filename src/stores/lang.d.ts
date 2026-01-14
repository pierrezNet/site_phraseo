export declare const useLangStore: import("pinia").StoreDefinition<"lang", {
    current: string;
}, {}, {
    changeLanguage(lang: string): void;
    loadLanguage(): void;
}>;
