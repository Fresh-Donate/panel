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
    description="Tebex Headless API не позволяет передать произвольную сумму — корзина собирается из заранее созданных пакетов фиксированного номинала. Создайте 6 пакетов в Tebex Dashboard с указанными ценами и вставьте их ID сюда."
  >
    <div class="space-y-3">
      <UFormField
        v-for="denom in DENOMINATIONS"
        :key="denom"
        :label="`Пакет ${denom} ${currency}`"
      >
        <UInput
          :model-value="packageIdFor(denom)"
          :placeholder="`Package ID для номинала ${denom} ${currency}`"
          class="w-full max-w-lg"
          @update:model-value="(val) => emit('update:coin', denom, String(val))"
        />
      </UFormField>

      <UAlert
        ID
        icon="i-lucide-info"
        color="info"
        variant="subtle"
        title="Как заполнить"
        description="В Tebex Dashboard → Packages создайте 6 пакетов с ценами выше. Тип — Single payment, имя можно "
        Coin
        1000"
        и
        т.д.
        откройте
        каждый
        пакет,
        скопируйте
        Package
        из
        URL
        или
        из
        API-страницы
        и
        вставьте
        сюда."
      />
    </div>
  </UPageCard>
</template>
