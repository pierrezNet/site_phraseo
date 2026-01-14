import { defineComponent, ref } from 'vue';
import Navbar from './components/Navbar.vue';
import Tabs from './components/Tabs.vue';
import TaskTextDisplay from './components/TaskTextDisplay.vue';
import AideModal from './components/AideModal.vue';
import ParametresModal from './components/ParametresModal.vue';
import AboutModal from './components/AboutModal.vue';
import IvaoApiDemo from './components/IvaoApiDemo.vue';
export default defineComponent({
    name: 'App',
    components: {
        Navbar,
        Tabs,
        TaskTextDisplay,
        AideModal,
        ParametresModal,
        AboutModal,
        IvaoApiDemo
    },
    setup() {
        const aideModal = ref(null);
        const parametresModal = ref(null);
        const aboutModal = ref(null);
        const openModal = (modalName) => {
            switch (modalName) {
                case 'aide':
                    aideModal.value?.open();
                    break;
                case 'parametres':
                    parametresModal.value?.open();
                    break;
                case 'about':
                    aboutModal.value?.open();
                    break;
            }
        };
        const selectedTaskTexts = ref([]);
        const tabsRef = ref(null);
        const updateSelectedTaskTexts = (texts) => {
            selectedTaskTexts.value = texts;
        };
        // Méthode pour sélectionner un onglet et une tâche
        const selectTask = (tabCode, taskId) => {
            if (tabsRef.value) {
                // Changer l'onglet actif
                tabsRef.value.selectedTab = tabCode;
                // Attendre que le changement d'onglet soit effectué
                setTimeout(() => {
                    // Vérifier à nouveau tabsRef.value car sa valeur pourrait changer
                    if (tabsRef.value) {
                        // Trouver et sélectionner la tâche correspondante
                        const task = tabsRef.value.filteredPhaseTasks.find((t) => t._id === taskId);
                        if (task) {
                            tabsRef.value.logTask(task);
                        }
                    }
                }, 100);
            }
        };
        return {
            aideModal,
            parametresModal,
            aboutModal,
            openModal,
            selectedTaskTexts,
            updateSelectedTaskTexts,
            tabsRef,
            selectTask
        };
    }
});
debugger; /* PartiallyEnd: #3632/script.vue */
const __VLS_ctx = {};
const __VLS_componentsOption = {
    Navbar,
    Tabs,
    TaskTextDisplay,
    AideModal,
    ParametresModal,
    AboutModal,
    IvaoApiDemo
};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "app",
});
const __VLS_0 = {}.Navbar;
/** @type {[typeof __VLS_components.Navbar, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onOpenModal': {} },
    ...{ 'onSelectTask': {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onOpenModal': {} },
    ...{ 'onSelectTask': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onOpenModal: (__VLS_ctx.openModal)
};
const __VLS_8 = {
    onSelectTask: (__VLS_ctx.selectTask)
};
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-10 gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-span-12 md:col-span-4" },
});
const __VLS_9 = {}.Tabs;
/** @type {[typeof __VLS_components.Tabs, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ 'onTaskSelected': {} },
    ref: "tabsRef",
}));
const __VLS_11 = __VLS_10({
    ...{ 'onTaskSelected': {} },
    ref: "tabsRef",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_13;
let __VLS_14;
let __VLS_15;
const __VLS_16 = {
    onTaskSelected: (__VLS_ctx.updateSelectedTaskTexts)
};
/** @type {typeof __VLS_ctx.tabsRef} */ ;
var __VLS_17 = {};
var __VLS_12;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "instructions",
    ...{ class: "col-span-12 md:col-span-6 m-1 md:mt-3 md:ml-3" },
});
const __VLS_19 = {}.TaskTextDisplay;
/** @type {[typeof __VLS_components.TaskTextDisplay, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    selectedTaskTexts: (__VLS_ctx.selectedTaskTexts),
}));
const __VLS_21 = __VLS_20({
    selectedTaskTexts: (__VLS_ctx.selectedTaskTexts),
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-span-12 mt-6 px-4" },
});
const __VLS_23 = {}.IvaoApiDemo;
/** @type {[typeof __VLS_components.IvaoApiDemo, ]} */ ;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({}));
const __VLS_25 = __VLS_24({}, ...__VLS_functionalComponentArgsRest(__VLS_24));
__VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
    ...{ class: "fixed bottom-0 md:right-4 bg-white w-full md:w-1/3 modal" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-full mx-auto max-w-screen-xl p-1 pl-4 md:flex md:justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm text-gray-700 text-left md:text-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 980 980",
    width: "18",
    height: "18",
    ...{ class: "inline align-text-bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "490",
    cy: "490",
    r: "440",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "100",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M219,428H350a150,150 0 1 1 0,125H219a275,275 0 1 0 0-125z",
    fill: "currentColor",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    property: "dc:date",
    datatype: "xsd:gYear",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    property: "dc:date",
    datatype: "xsd:gYear",
});
(new Date().getFullYear());
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    property: "dc:publisher",
    href: "https://aeronautique.xyz/",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    href: "https://pierrez.net/",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    property: "dc:creator",
    resource: "#me",
});
const __VLS_27 = {}.AideModal;
/** @type {[typeof __VLS_components.AideModal, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
    ref: "aideModal",
}));
const __VLS_29 = __VLS_28({
    ref: "aideModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
/** @type {typeof __VLS_ctx.aideModal} */ ;
var __VLS_31 = {};
var __VLS_30;
const __VLS_33 = {}.ParametresModal;
/** @type {[typeof __VLS_components.ParametresModal, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    ref: "parametresModal",
}));
const __VLS_35 = __VLS_34({
    ref: "parametresModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
/** @type {typeof __VLS_ctx.parametresModal} */ ;
var __VLS_37 = {};
var __VLS_36;
const __VLS_39 = {}.AboutModal;
/** @type {[typeof __VLS_components.AboutModal, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    ref: "aboutModal",
}));
const __VLS_41 = __VLS_40({
    ref: "aboutModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
/** @type {typeof __VLS_ctx.aboutModal} */ ;
var __VLS_43 = {};
var __VLS_42;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-10']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-12']} */ ;
/** @type {__VLS_StyleScopedClasses['md:col-span-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-12']} */ ;
/** @type {__VLS_StyleScopedClasses['md:col-span-6']} */ ;
/** @type {__VLS_StyleScopedClasses['m-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['md:ml-3']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-12']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['md:right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['md:w-1/3']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-screen-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['md:text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['inline']} */ ;
/** @type {__VLS_StyleScopedClasses['align-text-bottom']} */ ;
// @ts-ignore
var __VLS_18 = __VLS_17, __VLS_32 = __VLS_31, __VLS_38 = __VLS_37, __VLS_44 = __VLS_43;
var __VLS_dollars;
let __VLS_self;
