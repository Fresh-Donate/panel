<script setup lang="ts">
import type { PaymentMethod, CommissionRule, CommissionMode } from '~/types'

const props = defineProps<{
  methods: PaymentMethod[]
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

const enabledMethods = computed(() => props.methods.filter(m => m.enabled))

function examplePrice(method: PaymentMethod): string {
  const price = 100
  const comm = method.commission

  if (rule.value.mode === 'seller') {
    const receive = (price - price * comm / 100).toFixed(2)
    return `Покупатель платит ${price}₽ → вы получаете ${receive}₽`
  } else if (rule.value.mode === 'buyer') {
    const total = (price + price * comm / 100).toFixed(2)
    return `Цена ${price}₽ → покупатель платит ${total}₽ → вы получаете ${price}₽`
  } else {
    const halfComm = comm / 2
    const buyerPays = (price + price * halfComm / 100).toFixed(2)
    const sellerReceives = (price - price * halfComm / 100).toFixed(2)
    return `Покупатель платит ${buyerPays}₽ → вы получаете ${sellerReceives}₽`
  }
}
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
    <div
      v-if="enabledMethods.length > 0"
      class="mt-4 p-4 rounded-lg bg-muted/5 border border-default"
    >
      <p class="text-xs font-medium text-muted mb-2">
        Пример расчёта (товар за 100₽)
      </p>
      <div class="space-y-1.5">
        <div
          v-for="method in enabledMethods"
          :key="method.id"
          class="flex items-start gap-2 text-xs"
        >
          <span class="font-medium shrink-0 min-w-24">{{ method.name }}:</span>
          <span class="text-muted">{{ examplePrice(method) }}</span>
        </div>
      </div>
    </div>
  </UPageCard>
</template>
