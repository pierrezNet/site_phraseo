import { defineComponent, ref } from 'vue';
import Navbar from './components/Navbar.vue';
import Tabs from './components/Tabs.vue';
import TaskTextDisplay from './components/TaskTextDisplay.vue';
import AideModal from './components/AideModal.vue';
import ParametresModal from './components/ParametresModal.vue';
import AboutModal from './components/AboutModal.vue';
export default defineComponent({
    name: 'App',
    components: {
        Navbar,
        Tabs,
        TaskTextDisplay,
        AideModal,
        ParametresModal,
        AboutModal
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
        const updateSelectedTaskTexts = (texts) => {
            selectedTaskTexts.value = texts;
        };
        return {
            aideModal,
            parametresModal,
            aboutModal,
            openModal,
            selectedTaskTexts,
            updateSelectedTaskTexts
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
    AboutModal
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
}));
const __VLS_2 = __VLS_1({
    ...{ 'onOpenModal': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onOpenModal: (__VLS_ctx.openModal)
};
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-10 gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-span-4" },
});
const __VLS_8 = {}.Tabs;
/** @type {[typeof __VLS_components.Tabs, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onTaskSelected': {} },
}));
const __VLS_10 = __VLS_9({
    ...{ 'onTaskSelected': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onTaskSelected: (__VLS_ctx.updateSelectedTaskTexts)
};
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "instructions",
    ...{ class: "col-span-6 mt-3" },
});
const __VLS_16 = {}.TaskTextDisplay;
/** @type {[typeof __VLS_components.TaskTextDisplay, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    selectedTaskTexts: (__VLS_ctx.selectedTaskTexts),
}));
const __VLS_18 = __VLS_17({
    selectedTaskTexts: (__VLS_ctx.selectedTaskTexts),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
    ...{ class: "bg-white rounded-lg shadow-sm m-4 dark:bg-gray-800 modal" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm text-gray-500 sm:text-center dark:text-gray-400" },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    property: "dc:date",
    datatype: "xsd:gYear",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    property: "dc:date",
    datatype: "xsd:gYear",
});
(new Date().getFullYear());
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    href: "#",
    ...{ class: "hover:underline me-4 md:me-6" },
});
const __VLS_20 = {}.AideModal;
/** @type {[typeof __VLS_components.AideModal, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ref: "aideModal",
}));
const __VLS_22 = __VLS_21({
    ref: "aideModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
/** @type {typeof __VLS_ctx.aideModal} */ ;
var __VLS_24 = {};
var __VLS_23;
const __VLS_26 = {}.ParametresModal;
/** @type {[typeof __VLS_components.ParametresModal, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    ref: "parametresModal",
}));
const __VLS_28 = __VLS_27({
    ref: "parametresModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
/** @type {typeof __VLS_ctx.parametresModal} */ ;
var __VLS_30 = {};
var __VLS_29;
const __VLS_32 = {}.AboutModal;
/** @type {[typeof __VLS_components.AboutModal, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ref: "aboutModal",
}));
const __VLS_34 = __VLS_33({
    ref: "aboutModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
/** @type {typeof __VLS_ctx.aboutModal} */ ;
var __VLS_36 = {};
var __VLS_35;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-10']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-6']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['m-4']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-screen-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['inline']} */ ;
/** @type {__VLS_StyleScopedClasses['align-text-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:mt-0']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
/** @type {__VLS_StyleScopedClasses['me-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:me-6']} */ ;
// @ts-ignore
var __VLS_25 = __VLS_24, __VLS_31 = __VLS_30, __VLS_37 = __VLS_36;
var __VLS_dollars;
let __VLS_self;
