<template>
  <!-- Réglages de l'entraînement, une ligne nommée par réglage (menu mobile et panneau du bureau) -->
  <div class="space-y-3 text-sm">
    <div class="pref-row">
      <span class="pref-label">{{ t('pref.level') }}</span>
      <div class="pref-segments" role="radiogroup" :aria-label="t('pref.level')">
        <button
          v-for="level in LEVEL_OPTIONS"
          :key="level.value"
          type="button"
          role="radio"
          :aria-checked="formStore.form.LEVEL === level.value"
          :class="['pref-segment', formStore.form.LEVEL === level.value && 'pref-segment--on']"
          @click="formStore.setLevel(level.value)"
        >
          {{ t(`level.${level.value}`) }}
        </button>
      </div>
    </div>

    <div class="pref-row">
      <span class="pref-label">
        {{ t('pref.quiz') }}
        <span class="pref-hint">{{ t('pref.quizHint') }}</span>
      </span>
      <button
        type="button"
        role="switch"
        :aria-checked="quizStore.enabled"
        :aria-label="t('pref.quiz')"
        :class="['pref-switch', quizStore.enabled && 'pref-switch--on']"
        @click="quizStore.toggle()"
      ></button>
    </div>

    <div v-if="voice.available" class="pref-row">
      <span class="pref-label">
        {{ t('pref.voice') }}
        <span class="pref-hint">{{ t('pref.voiceHint') }}</span>
        <span v-if="voice.quotaLeft !== null" class="pref-hint">{{ t('pref.voiceQuota', { n: Math.round(voice.quotaLeft * 100) }) }}</span>
      </span>
      <button
        type="button"
        role="switch"
        :aria-checked="voice.enabled"
        :aria-label="t('pref.voice')"
        :class="['pref-switch', voice.enabled && 'pref-switch--on']"
        @click="voice.toggle()"
      ></button>
    </div>

    <div class="pref-row">
      <span class="pref-label">
        {{ t('pref.exchangeLang') }}
        <span class="pref-hint">{{ t('pref.exchangeLangHint') }}</span>
      </span>
      <div class="pref-segments" role="radiogroup" :aria-label="t('pref.exchangeLang')">
        <button
          v-for="l in LANGS"
          :key="l"
          type="button"
          role="radio"
          :aria-checked="lang.current === l"
          :title="t(`lang.${l}`)"
          :class="['pref-segment', lang.current === l && 'pref-segment--on']"
          @click="lang.changeLanguage(l)"
        >
          {{ l.toUpperCase() }}
        </button>
      </div>
    </div>

    <div class="pref-row">
      <span class="pref-label">{{ t('pref.uiLang') }}</span>
      <div class="pref-segments" role="radiogroup" :aria-label="t('pref.uiLang')">
        <button
          v-for="l in LANGS"
          :key="l"
          type="button"
          role="radio"
          :aria-checked="lang.ui === l"
          :title="t(`lang.${l}`)"
          :class="['pref-segment', lang.ui === l && 'pref-segment--on']"
          @click="lang.changeUiLanguage(l)"
        >
          {{ l.toUpperCase() }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormStore, LEVEL_OPTIONS, type Language } from '../stores/form'
import { useQuizStore } from '../stores/quiz'
import { useVoiceStore } from '../stores/voice'
import { useI18n } from '../i18n'

const LANGS: Language[] = ['fr', 'en']

const { t, lang } = useI18n()
const formStore = useFormStore()
const quizStore = useQuizStore()
const voice = useVoiceStore()
</script>

<style scoped>
.pref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.pref-label {
  display: flex;
  flex-direction: column;
  font-weight: 500;
}
.pref-hint {
  font-weight: 400;
  font-size: 0.75rem;
  color: #bfdbfe;
}
.pref-segments {
  display: inline-flex;
  flex-shrink: 0;
  border-radius: 0.375rem;
  background-color: #172554;
  padding: 2px;
}
.pref-segment {
  padding: 0.125rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #bfdbfe;
  cursor: pointer;
}
.pref-segment:hover {
  color: white;
}
.pref-segment--on,
.pref-segment--on:hover {
  background-color: white;
  color: #1e3a8a;
}
.pref-switch {
  position: relative;
  flex-shrink: 0;
  width: 2.5rem;
  height: 1.375rem;
  border-radius: 9999px;
  background-color: #6b7280;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.pref-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 9999px;
  background-color: white;
  transition: transform 0.15s ease;
}
.pref-switch--on {
  background-color: #22c55e;
}
.pref-switch--on::after {
  transform: translateX(1.125rem);
}
.pref-segment:focus-visible,
.pref-switch:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}
</style>
