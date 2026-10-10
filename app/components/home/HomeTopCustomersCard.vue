<script setup lang="ts">
import type { Customer, CustomerCurrencyStats, Paginated, Range } from '~/types'

const props = defineProps<{
  range: Range
  currency?: string
}>()

const api = useApi()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const customers = ref<Customer[]>([])

async function load() {
  try {
    const [list] = await Promise.all([
      api<Paginated<Customer>>('/customers', {
        query: {
          sortBy: 'totalSpent',
          sortOrder: 'desc',
          limit: 5,
          from: props.range.start.toISOString(),
          to: props.range.end.toISOString()
        }
      }),
      settingsStore.ensureLoaded()
    ])
    customers.value = list.items
  } catch {
    customers.value = []
  }
}

watch([() => props.range, () => props.currency], load, { immediate: true })

const targetCurrency = computed(() =>
  (props.currency || settings.value?.base_currency || 'RUB').toUpperCase()
)

function toTarget(stats: CustomerCurrencyStats[]): number {
  const s = settings.value
  if (!s) return 0
  const base = s.base_currency
  const target = targetCurrency.value
  let total = 0
  for (const stat of stats) {
    const inBase = stat.currency === base
      ? stat.totalSpent
      : stat.totalSpent * (s.currency_rates[stat.currency] ?? 1)
    total += target === base
      ? inBase
      : inBase / (s.currency_rates[target] ?? 1)
  }
  return total
}

const items = computed(() => {
  const list = customers.value
    .map(c => ({ ...c, totalConverted: toTarget(c.stats) }))
    .sort((a, b) => b.totalConverted - a.totalConverted)
  const totalSum = list.reduce((acc, c) => acc + c.totalConverted, 0)
  const maxAmount = list[0]?.totalConverted ?? 0
  return list.map((c, i) => ({
    ...c,
    position: i + 1,
    pct: totalSum > 0 ? Math.round((c.totalConverted / totalSum) * 100) : 0,
    barWidth: maxAmount > 0 ? (c.totalConverted / maxAmount) * 100 : 0
  }))
})

function formatAmount(n: number): string {
  return formatMoney(n, targetCurrency.value, { cents: true })
}
</script>

<template>
  <UCard>
    <div class="grid grid-cols-5 gap-4 text-xs text-muted uppercase font-normal text-left mb-2">
      <p>
        #
      </p>
      <p class="col-span-2">
        Игрок
      </p>
      <p class="col-span-2 text-right">
        Потратил
      </p>
    </div>

    <div
      v-if="items.length > 0"
      class="flex flex-col gap-2"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="grid grid-cols-5 items-center gap-4"
      >
        <img
          :src="`https://assets.zaralx.ru/api/v2/minecraft/players/${item.nickname}/face?size=32`"
          class="w-4 h-4"
          :alt="item.nickname"
        >
        <span class="text-sm text-highlighted truncate col-span-2">
          {{ item.nickname }}
        </span>
        <span class="text-sm font-medium text-highlighted tabular-nums text-right col-span-2">
          {{ formatAmount(item.totalConverted) }}
        </span>
      </div>
    </div>

    <div
      v-else
      class="h-40 flex items-center justify-center"
    >
      <p class="text-sm text-muted">
        Нет данных
      </p>
    </div>
  </UCard>
</template>
