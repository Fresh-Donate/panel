<script setup lang="ts">
import type { Range, StatsSummary } from '~/types'
import HomeStatCard from '~/components/home/HomeStatCard.vue'

const props = defineProps<{
  range: Range
  currency?: string
}>()

const config = useRuntimeConfig()
const token = useCookie('auth_token')

const summary = ref<StatsSummary | null>(null)

const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }
const currencySymbol = computed(() => {
  const code = summary.value?.currency || 'RUB'
  return currencySymbols[code] || code
})

async function loadSummary() {
  const params: Record<string, string> = {
    from: props.range.start.toISOString(),
    to: props.range.end.toISOString()
  }
  if (props.currency) params.currency = props.currency

  try {
    summary.value = await $fetch<StatsSummary>('/stats/summary', {
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` },
      params
    })
  } catch {
    summary.value = null
  }
}

watch([() => props.range, () => props.currency], loadSummary, { immediate: true })
</script>

<template>
  <div class="grid grid-cols-4 gap-6">
    <HomeStatCard
      icon="lucide:user"
      label="Клиенты"
      :current="summary?.customers.current ?? 0"
      :previous="summary?.customers.previous ?? 0"
      :sparkline="summary?.customers.sparkline ?? []"
    />

    <HomeStatCard
      icon="lucide:shopping-cart"
      label="Платежей"
      :current="summary?.payments.current ?? 0"
      :previous="summary?.payments.previous ?? 0"
      :sparkline="summary?.payments.sparkline ?? []"
    />

    <HomeStatCard
      icon="lucide:wallet"
      label="Выручка"
      :current="summary?.revenue.current ?? 0"
      :previous="summary?.revenue.previous ?? 0"
      :sparkline="summary?.revenue.sparkline ?? []"
      :formatter="(n) => `${n.toLocaleString('ru-RU')} ${currencySymbol}`"
    />

    <HomeStatCard
      icon="lucide:receipt"
      label="Средний чек"
      :current="summary?.avgOrder.current ?? 0"
      :previous="summary?.avgOrder.previous ?? 0"
      :sparkline="summary?.avgOrder.sparkline ?? []"
      :formatter="(n) => `${n.toLocaleString('ru-RU')} ${currencySymbol}`"
    />
  </div>
</template>
