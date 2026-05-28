<script setup lang="ts">
import HomeStatCard from '~/components/home/HomeStatCard.vue'

const props = defineProps<{
  stateKey?: string
}>()

const { summary } = useStatsSummary(props.stateKey)

const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }
const currencySymbol = computed(() => {
  const code = summary.value?.currency || 'RUB'
  return currencySymbols[code] || code
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
    <HomeStatCard
      icon="lucide:user"
      label="Клиенты"
      :current="summary?.customers?.current ?? 0"
      :previous="summary?.customers?.previous ?? 0"
      :sparkline="summary?.customers?.sparkline ?? []"
    />

    <HomeStatCard
      icon="lucide:shopping-cart"
      label="Платежей"
      :current="summary?.payments?.current ?? 0"
      :previous="summary?.payments?.previous ?? 0"
      :sparkline="summary?.payments?.sparkline ?? []"
    />

    <HomeStatCard
      icon="lucide:percent"
      label="Комиссии"
      :current="summary?.commission?.current ?? 0"
      :previous="summary?.commission?.previous ?? 0"
      :sparkline="summary?.commission?.sparkline ?? []"
      :formatter="(n) => `${n.toLocaleString('ru-RU')} ${currencySymbol}`"
    />

    <HomeStatCard
      icon="lucide:receipt"
      label="Средний чек"
      :current="summary?.avgOrder?.current ?? 0"
      :previous="summary?.avgOrder?.previous ?? 0"
      :sparkline="summary?.avgOrder?.sparkline ?? []"
      :formatter="(n) => `${n.toLocaleString('ru-RU')} ${currencySymbol}`"
    />
  </div>
</template>
