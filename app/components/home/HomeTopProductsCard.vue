<script setup lang="ts">
const { summary } = useStatsSummary()

const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }
const currencySymbol = computed(() => currencySymbols[summary.value?.currency || 'RUB'] || '₽')

const items = computed(() => {
  const top = (summary.value?.topProducts ?? []).slice(0, 5)
  const totalAmount = top.reduce((acc, p) => acc + p.amount, 0)
  const maxAmount = top[0]?.amount ?? 0
  return top.map((p, i) => ({
    ...p,
    position: i + 1,
    pct: totalAmount > 0 ? Math.round((p.amount / totalAmount) * 100) : 0,
    barWidth: maxAmount > 0 ? (p.amount / maxAmount) * 100 : 0
  }))
})

function formatAmount(n: number): string {
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol.value}`
}
</script>

<template>
  <UCard>
    <div class="grid grid-cols-8 gap-4 text-xs text-muted uppercase font-normal text-left mb-2">
      <p>
        #
      </p>
      <p class="col-span-2">
        Название
      </p>
      <p class="col-span-2 text-right">
        Выручка
      </p>
      <p class="col-span-2 text-center">
        %
      </p>
      <p />
    </div>

    <div
      v-if="items.length > 0"
      class="flex flex-col gap-2"
    >
      <div
        v-for="item in items"
        :key="item.productId"
        class="grid grid-cols-8 items-center gap-4"
      >
        <span class="text-sm text-muted tabular-nums">
          {{ item.position }}
        </span>
        <span class="text-sm text-highlighted truncate col-span-2">
          {{ item.productName }}
        </span>
        <span class="text-sm font-medium text-highlighted tabular-nums text-right col-span-2">
          {{ formatAmount(item.amount) }}
        </span>
        <div class="h-2 w-full col-span-2">
          <div
            class="h-full bg-primary rounded-full"
            :style="{ width: `${item.barWidth}%` }"
          />
        </div>
        <span class="text-sm text-muted tabular-nums text-right">
          {{ item.pct }}%
        </span>
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
