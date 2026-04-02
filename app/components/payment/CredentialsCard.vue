<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const props = defineProps<{
  provider: PaymentProvider
}>()

const credentialLabels: Record<string, Record<string, { label: string, placeholder: string }>> = {
  yookassa: {
    shopId: { label: 'Shop ID', placeholder: 'Введите Shop ID из личного кабинета ЮKassa' },
    secretKey: { label: 'Секретный ключ', placeholder: 'Введите секретный ключ' }
  },
  heleket: {
    apiKey: { label: 'API Key', placeholder: 'Введите API ключ из Heleket' },
    merchantId: { label: 'Merchant ID', placeholder: 'Введите идентификатор мерчанта' }
  }
}

function getLabel(key: string): string {
  return credentialLabels[props.provider.id]?.[key]?.label || key
}

function getPlaceholder(key: string): string {
  return credentialLabels[props.provider.id]?.[key]?.placeholder || ''
}

function isSecret(key: string): boolean {
  const lower = key.toLowerCase()
  return lower.includes('secret') || lower.includes('key')
}
</script>

<template>
  <UPageCard
    title="Подключение"
    description="Данные для авторизации в платёжной системе."
  >
    <div class="space-y-4">
      <UFormField
        v-for="(_, key) in provider.credentials"
        :key="key"
        :label="getLabel(key as string)"
      >
        <UInput
          v-model="provider.credentials[key as string]"
          :type="isSecret(key as string) ? 'password' : 'text'"
          :placeholder="getPlaceholder(key as string)"
          class="w-full max-w-lg"
        />
      </UFormField>
    </div>
  </UPageCard>
</template>
