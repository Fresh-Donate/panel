<script setup lang="ts">
const { funnel } = useStatsFunnel()

const pct = (part: number, whole: number) => whole > 0 ? Math.round((part / whole) * 100) : 0
const duration = (s: number | null | undefined) => s === null || s === undefined ? '-' : formatDuration(s)

const DOT = {
  progress: 'bg-warning',
  error: 'bg-error',
  returned: 'bg-info',
  delivered: 'bg-primary',
  neutral: 'bg-(--ui-text-dimmed)'
}

const hasData = computed(() => (funnel.value?.attempts ?? 0) > 0)

const steps = computed(() => {
  const f = funnel.value
  if (!f) return []
  const paidShare = pct(f.paid, f.attempts)
  return [
    {
      label: 'Попыток',
      count: f.attempts,
      caption: `из ${formatNumber(f.orders)} ${pluralize(f.orders, ['заказа', 'заказов', 'заказов'])}`,
      share: 100
    },
    {
      label: 'Оплачено',
      count: f.paid,
      caption: `${paidShare}% от попыток`,
      share: paidShare
    }
  ]
})

const rows = computed(() => {
  const f = funnel.value
  if (!f) return []
  const row = (label: string, count: number, marker: string, hint?: string) => ({ label, count, marker, hint, divider: false })
  const payment = [
    row('Вернулись позже', f.returnedLater, DOT.returned, 'Купили в течение 7 дней'),
    row('Ушли после отказа', f.leftAfterDecline, DOT.error, 'Провайдер отклонил оплату, покупки не было'),
    row('Ушли без покупки', f.left, DOT.neutral, 'Не купили в течение 7 дней'),
    row('Ждут оплаты', f.awaitingPayment, DOT.progress)
  ].filter(r => r.count > 0)
  const issues = [
    row('Ошибка выдачи', f.deliveryFailed, DOT.error),
    row('Ждут выдачи', f.awaitingDelivery, DOT.progress),
    row('Возврат', f.refundedBeforeDelivery, DOT.neutral)
  ].filter(r => r.count > 0)
  const delivered = {
    ...row('Выдано', f.delivered, issues.length === 0 ? 'check' : DOT.delivered, `${pct(f.delivered, f.paid)}% от оплаченных`),
    divider: payment.length > 0
  }
  return [...payment, delivered, ...issues]
})

const metrics = computed(() => {
  const f = funnel.value
  if (!f) return []
  return [
    { label: 'С первого заказа', value: `${pct(f.paidFirstTry, f.paid)}%`, hint: 'Оплаты без пересоздания заказа' },
    { label: 'Время до оплаты', value: duration(f.medianSecondsToPay), hint: 'Медиана от первого заказа попытки до оплаты' },
    { label: 'Время до выдачи', value: duration(f.medianSecondsToDeliver), hint: 'Медиана от оплаты до выдачи' },
    { label: 'Возвраты', value: formatNumber(f.refunded) }
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
          Попытка - заказы одного игрока с перерывом до 30 минут
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
          :disabled="!m.hint"
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
      class="grid grid-cols-2 gap-x-4 sm:gap-x-6 mt-6"
    >
      <div
        v-for="(step, i) in steps"
        :key="step.label"
        class="min-w-0"
      >
        <p class="text-xs text-muted">
          {{ step.label }}
        </p>
        <p class="text-2xl font-semibold text-highlighted tabular-nums leading-tight mt-1">
          {{ formatNumber(step.count) }}
        </p>
        <p class="text-xs text-dimmed tabular-nums">
          {{ step.caption }}
        </p>

        <div class="h-28 mt-3 rounded-md bg-elevated/50 overflow-hidden flex flex-col justify-end">
          <div
            class="bg-primary/20 transition-[height] duration-500"
            :style="{ height: `${100 - step.share}%` }"
          />
          <div
            class="bg-primary transition-[height] duration-500"
            :style="{ height: `${step.share}%` }"
          />
        </div>

        <ul
          v-if="i === steps.length - 1"
          class="mt-3 space-y-1.5 text-xs"
        >
          <UTooltip
            v-for="r in rows"
            :key="r.label"
            :text="r.hint"
            :disabled="!r.hint"
          >
            <li
              class="flex items-center justify-between gap-2"
              :class="r.divider && 'border-t border-default pt-1.5'"
            >
              <span class="flex items-center gap-1.5 min-w-0 text-muted">
                <span class="w-3 flex justify-center shrink-0">
                  <UIcon
                    v-if="r.marker === 'check'"
                    name="i-lucide-check"
                    class="size-3 text-success"
                  />
                  <span
                    v-else
                    class="size-1.5 rounded-full"
                    :class="r.marker"
                  />
                </span>
                <span class="truncate">{{ r.label }}</span>
              </span>
              <span class="text-highlighted tabular-nums">{{ formatNumber(r.count) }}</span>
            </li>
          </UTooltip>
        </ul>
      </div>
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
