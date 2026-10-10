<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const props = defineProps<{
  provider: PaymentProvider
}>()

const emit = defineEmits<{
  'update:coin': [denomination: string, packageId: string]
}>()

const DENOMINATIONS = ['1000', '100', '10', '1', '0.1', '0.01'] as const

const currency = computed(() => props.provider.supportedCurrencies[0] || 'USD')

function packageIdFor(denom: string): string {
  return props.provider.providerConfig?.coinPackages?.[denom] || ''
}
</script>

<template>
  <UPageCard
    title="Coin-пакеты Tebex"
    description="Tebex не принимает произвольную сумму, поэтому корзина собирается из пакетов фиксированного номинала."
  >
    <div class="space-y-3">
      <UFormField
        v-for="denom in DENOMINATIONS"
        :key="denom"
        :label="`Пакет ${denom} ${currency}`"
      >
        <UInput
          :model-value="packageIdFor(denom)"
          placeholder="Package ID"
          class="w-full max-w-lg"
          @update:model-value="(val) => emit('update:coin', denom, String(val))"
        />
      </UFormField>

      <UAlert
        icon="i-lucide-info"
        color="info"
        variant="subtle"
        title="Как заполнить"
        description="В Tebex Dashboard → Packages создайте 6 пакетов типа Single payment с ценами из списка и вставьте сюда их Package ID."
      />
    </div>
  </UPageCard>
</template>
