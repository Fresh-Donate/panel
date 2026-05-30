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
  <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    <HomeStatCard
      icon="lucide:wallet"
      label="Выручка (Неделя)"
      :current="summary?.revenue?.current ?? 0"
      :previous="summary?.revenue?.previous ?? 0"
      :sparkline="summary?.revenue?.sparkline ?? []"
      :formatter="(n) => `${n.toLocaleString('ru-RU')} ${currencySymbol}`"
    />

    <HomeStatCard
      icon="lucide:shopping-cart"
      label="Покупок (Неделя)"
      :current="summary?.payments?.current ?? 0"
      :previous="summary?.payments?.previous ?? 0"
      :sparkline="summary?.payments?.sparkline ?? []"
    />

    <div class="lg:col-span-2 xl:col-span-1">
      <HomeStatCard
        icon="lucide:receipt"
        label="Средний чек (Неделя)"
        :current="summary?.avgOrder?.current ?? 0"
        :previous="summary?.avgOrder?.previous ?? 0"
        :sparkline="summary?.avgOrder?.sparkline ?? []"
        :formatter="(n) => `${n.toLocaleString('ru-RU')} ${currencySymbol}`"
      />
    </div>
  </div>
</template>
