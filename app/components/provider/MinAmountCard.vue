<script setup lang="ts">
import { MIN_AMOUNT_LOWER, MIN_AMOUNT_UPPER } from '~/types'

const props = defineProps<{
  baseCurrency: string
}>()

const minAmount = defineModel<number>('minAmount', { required: true })

const currencyLabel = computed(() => currencySymbol(props.baseCurrency))
</script>

<template>
  <UPageCard
    title="Минимальная сумма платежа"
    description="В базовой валюте панели, при её смене пересчитывается автоматически."
  >
    <UFormField>
      <div class="flex items-center gap-2">
        <UInput
          v-model.number="minAmount"
          type="number"
          :min="MIN_AMOUNT_LOWER"
          :max="MIN_AMOUNT_UPPER"
          :step="0.01"
          class="w-40"
        />
        <span class="text-sm text-muted">{{ currencyLabel }}</span>
      </div>
    </UFormField>

    <p class="text-xs text-muted mt-3">
      От {{ MIN_AMOUNT_LOWER }} до {{ MIN_AMOUNT_UPPER }} {{ baseCurrency }}.
    </p>
  </UPageCard>
</template>
