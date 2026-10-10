<script setup lang="ts">
const props = defineProps<{
  kind: 'hour' | 'weekday'
}>()

const { summary } = useStatsSummary()

const WEEKDAYS = [
  { short: 'Пн', full: 'понедельник' },
  { short: 'Вт', full: 'вторник' },
  { short: 'Ср', full: 'среда' },
  { short: 'Чт', full: 'четверг' },
  { short: 'Пт', full: 'пятница' },
  { short: 'Сб', full: 'суббота' },
  { short: 'Вс', full: 'воскресенье' }
]
const HOUR_TICKS = new Set([0, 6, 12, 18, 23])

const tz = timeZoneLabel()
const isHour = computed(() => props.kind === 'hour')
const title = computed(() => isHour.value ? 'Время суток' : 'Дни недели')
const description = computed(() =>
  `Насыщенность - доля от пикового ${isHour.value ? 'часа' : 'дня'}, ${tz}`
)

const pad = (n: number) => String(n).padStart(2, '0')
const paymentsLabel = (n: number) => `${formatNumber(n)} ${pluralize(n, ['платёж', 'платежа', 'платежей'])}`

const cells = computed(() => {
  const source = (isHour.value ? summary.value?.byHour : summary.value?.byWeekday) ?? []
  const size = isHour.value ? 24 : 7
  const buckets = Array.from({ length: size }, (_, i) => source[i] ?? { count: 0, amount: 0 })
  const max = Math.max(0, ...buckets.map(b => b.count))
  const currency = summary.value?.currency || 'RUB'

  return buckets.map((b, i) => {
    const weekday = WEEKDAYS[i]
    const head = isHour.value ? `${pad(i)}:00–${pad((i + 1) % 24)}:00` : weekday?.short
    const share = max > 0 ? b.count / max : 0
    return {
      ...b,
      tick: isHour.value ? (HOUR_TICKS.has(i) ? pad(i) : '') : weekday?.short,
      name: isHour.value ? `${pad(i)}:00` : weekday?.full,
      tooltip: `${head} · ${paymentsLabel(b.count)} · ${formatMoney(b.amount, currency)}`,
      background: `color-mix(in oklab, var(--ui-primary) ${b.count > 0 ? Math.round(25 + 75 * share) : 6}%, var(--ui-bg-elevated))`
    }
  })
})

const peak = computed(() =>
  cells.value.reduce<typeof cells.value[number] | null>((best, c) => {
    if (c.count === 0) return best
    if (!best || c.count > best.count || (c.count === best.count && c.amount > best.amount)) return c
    return best
  }, null)
)
</script>

<template>
  <UCard>
    <p class="text-sm font-semibold text-highlighted">
      {{ title }}
    </p>
    <p class="text-xs text-muted mt-1">
      {{ description }}
    </p>

    <div
      class="grid gap-x-1 sm:gap-x-1.5 gap-y-2 mt-4"
      :style="{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }"
    >
      <UTooltip
        v-for="(cell, i) in cells"
        :key="`cell-${i}`"
        :text="cell.tooltip"
      >
        <div
          class="h-9 rounded-md transition-[filter] hover:brightness-125"
          :style="{ background: cell.background }"
          :aria-label="cell.tooltip"
        />
      </UTooltip>
      <span
        v-for="(cell, i) in cells"
        :key="`tick-${i}`"
        class="text-[11px] leading-none text-dimmed tabular-nums whitespace-nowrap"
      >
        {{ cell.tick }}
      </span>
    </div>

    <p class="text-xs text-muted mt-3">
      <template v-if="peak">
        Пик - <span class="font-semibold text-highlighted">{{ peak.name }}</span>, {{ paymentsLabel(peak.count) }}
      </template>
      <template v-else>
        Нет платежей за выбранный период
      </template>
    </p>
  </UCard>
</template>
