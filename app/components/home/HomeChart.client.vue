<script setup lang="ts">
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, parseISO, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { Period, Range } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  period: Period
  range: Range
  currency?: string
}>()

const config = useRuntimeConfig()
const token = useCookie('auth_token')

type DataRecord = {
  date: Date
  amount: number
  count: number
}

const { width } = useElementSize(cardRef)

const data = ref<DataRecord[]>([])

watch([() => props.period, () => props.range, () => props.currency], async () => {
  const from = props.range.start.toISOString()
  const to = props.range.end.toISOString()

  try {
    const params: Record<string, string> = { from, to, period: props.period }
    if (props.currency) params.currency = props.currency

    const chartData = await $fetch<{ date: string, amount: number, count: number }[]>('/stats/chart', {
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` },
      params
    })

    // Build a map from API data
    const dataMap = new Map<string, { amount: number, count: number }>()
    for (const item of chartData) {
      const key = normalizeKey(new Date(item.date))
      dataMap.set(key, { amount: item.amount, count: item.count })
    }

    // Generate all dates in range and fill gaps with 0
    const intervals = ({
      daily: eachDayOfInterval,
      weekly: eachWeekOfInterval,
      monthly: eachMonthOfInterval
    } as Record<Period, typeof eachDayOfInterval>)[props.period](props.range)

    data.value = intervals.map((date) => {
      const key = normalizeKey(date)
      const entry = dataMap.get(key)
      return {
        date,
        amount: entry?.amount || 0,
        count: entry?.count || 0
      }
    })
  } catch {
    data.value = []
  }
}, { immediate: true })

function normalizeKey(date: Date): string {
  if (props.period === 'monthly') {
    return format(startOfMonth(date), 'yyyy-MM')
  }
  if (props.period === 'weekly') {
    return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  }
  return format(startOfDay(date), 'yyyy-MM-dd')
}

const spentX = (_: DataRecord, i: number) => i
const spentY = (d: DataRecord) => d.amount

const countX = (_: DataRecord, i: number) => i
const countY = (d: DataRecord) => d.count

const total = computed(() => data.value.reduce((acc: number, { amount }) => acc + amount, 0))

const formatNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format

const currencySymbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }
const currencySymbol = computed(() => currencySymbols[props.currency || 'RUB'] || props.currency || '₽')

const formatDateLabel = (date: Date): string => {
  return ({
    daily: format(date, 'dd.MM.yy'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyy')
  })[props.period]
}

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) {
    return ''
  }
  return formatDateLabel(data.value[i].date)
}

const template = (d: DataRecord) => `
<p style="font-size: 0.9rem; font-weight: 400">${formatDateLabel(d.date)}</p>
<p style="font-size: 1.4rem; font-weight: 700">${formatNumber(d.amount)}${currencySymbol.value}</p>
Покупок: ${d.count} шт.`
</script>

<template>
  <UCard
    ref="cardRef"
    :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }"
  >
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">
          Выручка
        </p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ formatNumber(total) }}{{ currencySymbol }}
        </p>
      </div>
    </template>

    <VisXYContainer
      v-if="data.length > 0"
      :data="data"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine
        :x="spentX"
        :y="spentY"
        color="var(--ui-primary)"
      />
      <VisArea
        :x="spentX"
        :y="spentY"
        color="var(--ui-primary)"
        :opacity="0.1"
      />

      <VisLine
        :x="countX"
        :y="countY"
        color="var(--ui-success)"
      />
      <VisArea
        :x="countX"
        :y="countY"
        color="var(--ui-success)"
        :opacity="0.1"
      />

      <VisAxis
        type="x"
        :x="spentX"
        :tick-format="xTicks"
      />

      <VisCrosshair
        color="var(--ui-primary)"
        :template="template"
      />

      <VisTooltip />
    </VisXYContainer>

    <div
      v-else
      class="h-96 flex items-center justify-center"
    >
      <p class="text-sm text-muted">
        Нет данных за выбранный период
      </p>
    </div>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
