<script setup lang="ts">
import HomeStatCard from '~/components/home/HomeStatCard.vue'

const { summary } = useStatsSummary()

const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }
const currencySymbol = computed(() => {
  const code = summary.value?.currency || 'RUB'
  return currencySymbols[code] || code
})
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
