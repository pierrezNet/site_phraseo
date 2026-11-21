<template>
  <!-- Transparence : ce que les dons ont reçu et payé (données publiques d'Open Collective) -->
  <div v-if="fundStore.visible && fund" class="mt-2 rounded-lg border p-3 text-sm">
    <dl class="grid grid-cols-3 gap-2 text-center">
      <div>
        <dt class="text-xs opacity-70">{{ t('fund.received') }}</dt>
        <dd class="font-semibold">{{ money(fund.received) }}</dd>
      </div>
      <div>
        <dt class="text-xs opacity-70">{{ t('fund.spent') }}</dt>
        <dd class="font-semibold">{{ money(fund.spent) }}</dd>
      </div>
      <div>
        <dt class="text-xs opacity-70">{{ t('fund.balance') }}</dt>
        <dd class="font-semibold">{{ money(fund.balance) }}</dd>
      </div>
    </dl>

    <p class="mt-3 font-medium">{{ t('fund.latest') }}</p>
    <ul v-if="fund.expenses.length" class="mt-1 space-y-0.5">
      <li v-for="(e, i) in fund.expenses" :key="i" class="flex justify-between gap-3">
        <span class="min-w-0 truncate">{{ e.description }} <span class="opacity-60">· {{ day(e.date) }}</span></span>
        <span class="shrink-0">{{ money(e.amount) }}</span>
      </li>
    </ul>
    <p v-else class="mt-1 opacity-70">{{ t('fund.none') }}</p>

    <a :href="`${SUPPORT_URL}/transactions`" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block underline">{{ t('fund.all') }}</a>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFundStore } from '../stores/fund'
import { SUPPORT_URL } from '../utils/support'
import { useI18n } from '../i18n'

const { t, lang } = useI18n()
const fundStore = useFundStore()
const fund = computed(() => fundStore.fund)

const locale = computed(() => (lang.ui === 'fr' ? 'fr-FR' : 'en-GB'))
const money = (amount: number) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: fund.value?.currency ?? 'EUR' }).format(amount / 100)
const day = (date: string) =>
  date ? new Date(`${date}T12:00:00Z`).toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' }) : ''

onMounted(() => fundStore.load())
</script>
