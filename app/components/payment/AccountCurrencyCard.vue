<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const props = defineProps<{
  provider: PaymentProvider
}>()

const emit = defineEmits<{
  'update:currency': [value: string]
}>()

const AVAILABLE_CURRENCIES: Record<string, string[]> = {
  yookassa: ['RUB'],
  heleket: ['USD', 'EUR', 'RUB'],
  wata: ['RUB', 'USD', 'EUR'],
  robokassa: ['RUB'],
  tebex: ['USD', 'EUR']
}

const options = computed(() => {
  const codes = AVAILABLE_CURRENCIES[props.provider.providerId] || props.provider.supportedCurrencies
  return codes.map(code => ({ label: code, value: code }))
})

const selected = computed(() => props.provider.supportedCurrencies[0] || options.value[0]?.value || '')

const shouldShow = computed(() => options.value.length > 1)
</script>

<template>
  <UPageCard
    v-if="shouldShow"
    title="Валюта аккаунта"
    description="В какой валюте у вас настроен аккаунт у этой платёжной системы. Если товары в другой валюте - сумма будет пересчитана по курсам из общих настроек."
  >
    <USelectMenu
      :model-value="selected"
      :items="options"
      value-key="value"
      class="w-48"
      @update:model-value="(val: string | { value: string }) => emit('update:currency', typeof val === 'string' ? val : val.value)"
    />
  </UPageCard>
</template>
