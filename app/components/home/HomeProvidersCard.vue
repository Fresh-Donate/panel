<script setup lang="ts">
import { VisSingleContainer, VisDonut } from '@unovis/vue'

const { summary } = useStatsSummary()

const PROVIDER_NAMES: Record<string, string> = {
  wata: 'Wata',
  tebex: 'Tebex',
  heleket: 'Heleket',
  yookassa: 'YooKassa'
}

const COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe']

const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }
const currencySymbol = computed(() => currencySymbols[summary.value?.currency || 'RUB'] || '₽')

const items = computed(() => {
  const providers = summary.value?.paymentProviders ?? []
  const total = providers.reduce((acc, p) => acc + p.amount, 0)
  return providers
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .map((p, i) => ({
      ...p,
      name: p.providerId ? (PROVIDER_NAMES[p.providerId] || p.providerId) : 'Не задан',
      pct: total > 0 ? Math.round((p.amount / total) * 100) : 0,
      color: COLORS[i % COLORS.length]
    }))
})

const total = computed(() => items.value.reduce((acc, p) => acc + p.amount, 0))

const donutValue = (d: { amount: number }) => d.amount
const donutColor = (d: { color: string }) => d.color

function formatAmount(n: number): string {
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol.value}`
}
</script>

<template>
  <UCard>
    <div
      v-if="items.length > 0"
      class="flex items-center gap-8"
    >
      <div class="relative size-40 shrink-0">
        <VisSingleContainer
          :data="items"
          :height="160"
        >
          <VisDonut
            :value="donutValue"
            :color="donutColor"
            :arc-width="14"
            :pad-angle="0.02"
            :corner-radius="2"
          />
        </VisSingleContainer>
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span class="text-lg font-semibold text-highlighted leading-tight">
            {{ formatAmount(total) }}
          </span>
          <span class="text-xs text-muted">Всего</span>
        </div>
      </div>

      <div class="flex-1 flex flex-col gap-3 min-w-0">
        <div
          v-for="item in items"
          :key="item.providerId || 'unknown'"
          class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4"
        >
          <div
            class="size-3 rounded-full shrink-0"
            :style="{ background: item.color }"
          />
          <span class="text-sm text-highlighted truncate">{{ item.name }}</span>
          <span class="text-sm text-muted tabular-nums">{{ item.pct }}%</span>
          <span class="text-sm font-medium text-highlighted tabular-nums">{{ formatAmount(item.amount) }}</span>
        </div>
      </div>
    </div>

    <div
      v-else
      class="h-40 flex items-center justify-center"
    >
      <p class="text-sm text-muted">
        Нет данных за выбранный период
      </p>
    </div>
  </UCard>
</template>
