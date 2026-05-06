<script setup lang="ts">
import type { CommissionRule, CommissionMode } from '~/types'

const props = defineProps<{
  commissionPercent: number
  currency?: string
}>()

const rule = defineModel<CommissionRule>('rule', { required: true })

const commissionModes: { value: CommissionMode, label: string, description: string }[] = [
  {
    value: 'seller',
    label: 'Продавец оплачивает',
    description: 'Комиссия вычитается из суммы платежа'
  },
  {
    value: 'buyer',
    label: 'Покупатель оплачивает',
    description: 'Комиссия добавляется к цене товара'
  },
  {
    value: 'split',
    label: 'Поровну (50/50)',
    description: 'Комиссия делится пополам между вами и покупателем'
  }
]

const currencySymbol = computed(() => {
  switch (props.currency) {
    case 'RUB': return '₽'
    case 'USD': return '$'
    case 'EUR': return '€'
    default: return '₽'
  }
})

const example = computed(() => {
  const price = 100
  const comm = props.commissionPercent
  const s = currencySymbol.value

  if (rule.value.mode === 'seller') {
    const receive = (price - price * comm / 100).toFixed(2)
    return `Покупатель платит ${price}${s} → вы получаете ${receive}${s}`
  }
  if (rule.value.mode === 'buyer') {
    const total = (price + price * comm / 100).toFixed(2)
    return `Цена ${price}${s} → покупатель платит ${total}${s} → вы получаете ${price}${s}`
  }
  const halfComm = comm / 2
  const buyerPays = (price + price * halfComm / 100).toFixed(2)
  const sellerReceives = (price - price * halfComm / 100).toFixed(2)
  return `Покупатель платит ${buyerPays}${s} → вы получаете ${sellerReceives}${s}`
})
</script>

<template>
  <UPageCard
    title="Распределение комиссии"
    description="Определите, кто оплачивает комиссию платёжной системы."
  >
    <div class="space-y-3">
      <button
        v-for="mode in commissionModes"
        :key="mode.value"
        type="button"
        class="w-full text-left p-4 rounded-lg border transition-all cursor-pointer"
        :class="rule.mode === mode.value
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-default bg-elevated hover:border-muted'"
        @click="rule.mode = mode.value"
      >
        <div class="flex items-center gap-3">
          <span
            class="size-4 rounded-full border-2 flex items-center justify-center shrink-0"
            :class="rule.mode === mode.value ? 'border-primary' : 'border-muted'"
          >
            <span
              v-if="rule.mode === mode.value"
              class="size-2 rounded-full bg-primary"
            />
          </span>
          <div>
            <p class="font-medium text-sm">
              {{ mode.label }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              {{ mode.description }}
            </p>
          </div>
        </div>
      </button>
    </div>

    <!-- Commission example -->
    <div class="mt-4 p-4 rounded-lg bg-muted/5 border border-default">
      <p class="text-xs font-medium text-muted mb-2">
        Пример расчёта (товар за 100{{ currencySymbol }}, комиссия {{ commissionPercent }}%)
      </p>
      <p class="text-xs text-muted">
        {{ example }}
      </p>
    </div>
  </UPageCard>
</template>
