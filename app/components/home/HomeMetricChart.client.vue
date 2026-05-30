<script setup lang="ts">
import { eachHourOfInterval, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, isSameDay, startOfHour, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { Period, Range } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  title: string
  metric: 'amount' | 'count'
  period: Period
  range: Range
  currency?: string
  formatter?: (n: number) => string
  color?: string
  summaryMode?: 'sum' | 'today'
}>()

const config = useRuntimeConfig()
const token = useCookie('auth_token')

interface DataRecord {
  date: Date
  value: number
}

const { width } = useElementSize(cardRef)
const data = ref<DataRecord[]>([])

watch([() => props.period, () => props.range, () => props.currency, () => props.metric], async () => {
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

    const dataMap = new Map<string, number>()
    for (const item of chartData) {
      dataMap.set(normalizeKey(new Date(item.date)), item[props.metric])
    }

    // Fill in dates the API didn't return so the chart has even spacing.
    const intervals = ({
      hourly: eachHourOfInterval,
      daily: eachDayOfInterval,
      weekly: eachWeekOfInterval,
      monthly: eachMonthOfInterval
    } as Record<Period, typeof eachDayOfInterval>)[props.period](props.range)

    data.value = intervals.map(date => ({
      date,
      value: dataMap.get(normalizeKey(date)) || 0
    }))
  } catch {
    data.value = []
  }
}, { immediate: true })

function normalizeKey(date: Date): string {
  if (props.period === 'monthly') return format(startOfMonth(date), 'yyyy-MM')
  if (props.period === 'weekly') return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  if (props.period === 'hourly') return format(startOfHour(date), 'yyyy-MM-dd HH')
  return format(startOfDay(date), 'yyyy-MM-dd')
}

const x = (_: DataRecord, i: number) => i
const y = (d: DataRecord) => d.value

const total = computed(() => {
  if (props.summaryMode === 'today') {
    const today = data.value.find(d => isSameDay(d.date, new Date()))
    return today?.value ?? 0
  }
  return data.value.reduce((acc, { value }) => acc + value, 0)
})
const fmt = computed(() => props.formatter || ((n: number) => n.toLocaleString('ru-RU')))
const color = computed(() => props.color || 'var(--ui-primary)')

const formatDateLabel = (date: Date): string =>
  ({
    hourly: format(date, 'HH:00'),
    daily: format(date, 'dd.MM.yy'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyy')
  })[props.period]

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) return ''
  return formatDateLabel(data.value[i].date)
}

const template = (d: DataRecord) => `
<p style="font-size: 0.9rem; font-weight: 400">${formatDateLabel(d.date)}</p>
<p style="font-size: 1.4rem; font-weight: 700">${fmt.value(d.value)}</p>`
</script>

<template>
  <UCard
    ref="cardRef"
    class="relative"
    :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }"
  >
    <div class="absolute top-4 left-4">
      <p class="text-xs text-muted uppercase mb-1.5">
        {{ title }}
      </p>
      <p class="text-3xl text-highlighted font-semibold">
        {{ fmt(total) }}
      </p>
    </div>
    <VisXYContainer
      v-if="data.length > 0"
      :data="data"
      :padding="{ top: 40 }"
      class="h-64 mt-8"
      :width="width"
    >
      <VisLine
        :x="x"
        :y="y"
        :color="color"
      />
      <VisArea
        :x="x"
        :y="y"
        :color="color"
        :opacity="0.1"
      />
      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
        :grid-line="false"
        :tick-line="false"
        :domain-line="false"
      />
      <VisCrosshair
        :color="color"
        :template="template"
      />
      <VisTooltip />
    </VisXYContainer>

    <div
      v-else
      class="h-72 flex items-center justify-center"
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
