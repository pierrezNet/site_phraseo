declare const _default: import("vue").DefineComponent<{}, {
    selectedLanguage: import("vue").ComputedRef<string>;
    selectedSubgraphs: import("vue").Ref<never[], never[]>;
    replacePlaceholders: (text: any) => any;
    lastSelectedTaskId: import("vue").Ref<null, null>;
}, {
    tasks: never[];
    taskPhaseMap: {};
    selectedTab: string;
    isReady: boolean;
    selectedTaskIds: never[];
}, {
    phaseTabs(): {
        id: string;
        icon: string;
        color: string;
        label: string;
    }[];
    filteredPhaseTasks(): any;
}, {
    getColorFromClass(className: any): "blue" | "gray" | "purple" | "yellow";
    getTaskNameById(refid: any): any;
    handleTaskData(taskId: any): void;
    logTask(task: any): void;
    logSubgraphTask(subgraph: any): void;
    resetDisplay(): void;
    refreshDisplayedTexts(): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
