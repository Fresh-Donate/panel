<script setup lang="ts">
const { funnel } = useStatsFunnel()

const pct = (part: number, whole: number) => whole > 0 ? Math.round((part / whole) * 100) : 0
const duration = (s: number | null | undefined) => s === null || s === undefined ? '-' : formatDuration(s)

const DOT = {
  progress: 'bg-warning',
  error: 'bg-error',
  neutral: 'bg-(--ui-text-dimmed)'
}

const hasData = computed(() => (funnel.value?.created ?? 0) > 0)

const steps = computed(() => {
  const f = funnel.value
  if (!f) return []
  const loss = (label: string, count: number, dot: string) => ({ label, count, dot })
  const raw = [
    { label: 'Создано', count: f.created, losses: [] as ReturnType<typeof loss>[] },
    {
      label: 'Оплачено',
      count: f.paid,
      losses: [
        loss('Истекли', f.expired, DOT.neutral),
        loss('Отклонены', f.declined, DOT.error),
        loss('Ждут оплаты', f.awaitingPayment, DOT.progress)
      ]
    },
    {
      label: 'Выдано',
      count: f.delivered,
      losses: [
        loss('Ошибка выдачи', f.deliveryFailed, DOT.error),
        loss('Ждут выдачи', f.awaitingDelivery, DOT.progress),
        loss('Возврат', f.refundedBeforeDelivery, DOT.neutral)
      ]
    }
  ]
  return raw.map((step, i) => {
    const prev = raw[i - 1]?.count ?? step.count
    return {
      ...step,
      losses: step.losses.filter(l => l.count > 0),
      share: pct(step.count, f.created),
      lostShare: pct(prev - step.count, f.created),
      stepShare: pct(step.count, prev)
    }
  })
})

const metrics = computed(() => {
  const f = funnel.value
  if (!f) return []
  return [
    { label: 'Время до оплаты', value: duration(f.medianSecondsToPay), hint: 'Медиана от создания до оплаты' },
    { label: 'Время до выдачи', value: duration(f.medianSecondsToDeliver), hint: 'Медиана от оплаты до выдачи' },
    { label: 'Возвраты', value: formatNumber(f.refunded), hint: 'Заказы этого периода, по которым сделан возврат' }
  ]
})
</script>

<template>
  <UCard>
    <div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
      <div>
        <p class="text-sm font-semibold text-highlighted">
          Воронка заказов
        </p>
        <p class="text-xs text-muted mt-1">
          Заказы, созданные за выбранный период
        </p>
      </div>

      <dl
        v-if="hasData"
        class="flex flex-wrap gap-x-6 gap-y-2"
      >
        <UTooltip
          v-for="m in metrics"
          :key="m.label"
          :text="m.hint"
        >
          <div>
            <dt class="text-xs text-muted">
              {{ m.label }}
            </dt>
            <dd class="text-sm font-semibold text-highlighted tabular-nums mt-0.5">
              {{ m.value }}
            </dd>
          </div>
        </UTooltip>
      </dl>
    </div>

    <div
      v-if="hasData"
      class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 sm:gap-x-4 mt-6"
    >
      <template
        v-for="(step, i) in steps"
        :key="step.label"
      >
        <div :style="{ gridColumn: i * 2 + 1, gridRow: 1 }">
          <p class="text-xs text-muted">
            {{ step.label }}
          </p>
          <p class="text-2xl font-semibold text-highlighted tabular-nums leading-tight mt-1">
            {{ formatNumber(step.count) }}
          </p>
          <p class="text-xs text-dimmed tabular-nums">
            {{ i === 0 ? 'всего' : `${step.share}% от созданных` }}
          </p>
        </div>

        <div
          class="h-28 mt-3 rounded-md bg-elevated/50 overflow-hidden flex flex-col justify-end"
          :style="{ gridColumn: i * 2 + 1, gridRow: 2 }"
        >
          <div
            class="bg-primary/20 transition-[height] duration-500"
            :style="{ height: `${step.lostShare}%` }"
          />
          <div
            class="bg-primary transition-[height] duration-500"
            :style="{ height: `${step.share}%` }"
          />
        </div>

        <div
          v-if="i > 0"
          class="flex flex-col items-center justify-center mt-3 px-1"
          :style="{ gridColumn: i * 2, gridRow: 2 }"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 text-dimmed"
          />
          <span class="text-xs font-semibold text-highlighted tabular-nums">
            {{ step.stepShare }}%
          </span>
        </div>

        <ul
          class="mt-3 space-y-1.5 text-xs"
          :style="{ gridColumn: i * 2 + 1, gridRow: 3 }"
        >
          <li
            v-for="l in step.losses"
            :key="l.label"
            class="flex items-center justify-between gap-2"
          >
            <span class="flex items-center gap-1.5 min-w-0 text-muted">
              <span
                class="size-1.5 rounded-full shrink-0"
                :class="l.dot"
              />
              <span class="truncate">{{ l.label }}</span>
            </span>
            <span class="text-highlighted tabular-nums">{{ formatNumber(l.count) }}</span>
          </li>
          <li
            v-if="i > 0 && step.losses.length === 0"
            class="flex items-center gap-1.5 text-success"
          >
            <UIcon
              name="i-lucide-check"
              class="size-3.5"
            />
            Без потерь
          </li>
        </ul>
      </template>
    </div>

    <div
      v-else
      class="h-40 flex items-center justify-center"
    >
      <p class="text-sm text-muted">
        Нет заказов за выбранный период
      </p>
    </div>
  </UCard>
</template>
