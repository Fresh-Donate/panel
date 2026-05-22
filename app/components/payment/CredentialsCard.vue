<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const props = defineProps<{
  provider: PaymentProvider
}>()

const emit = defineEmits<{
  'update:credential': [key: string, value: string]
}>()

const credentialLabels: Record<string, Record<string, { label: string, placeholder: string }>> = {
  yookassa: {
    shopId: { label: 'Shop ID', placeholder: 'Введите Shop ID из личного кабинета ЮKassa' },
    secretKey: { label: 'Секретный ключ', placeholder: 'Введите секретный ключ' }
  },
  heleket: {
    apiKey: { label: 'API Key', placeholder: 'Введите API ключ из Heleket' },
    merchantId: { label: 'Merchant ID', placeholder: 'Введите идентификатор мерчанта' }
  },
  wata: {
    apiKey: { label: 'Access Token', placeholder: 'JWT-токен из кабинета Wata (prod или sandbox)' }
  },
  tebex: {
    webstoreToken: { label: 'Webstore Token', placeholder: 'Публичный токен из настроек Tebex (Webstore Builder → API Keys)' },
    privateKey: { label: 'Private Key', placeholder: 'Приватный ключ из настроек Tebex' },
    webhookSecret: { label: 'Webhook Secret', placeholder: 'Секрет для подписи webhook (Developers → Webhooks → Endpoints)' }
  }
}

function getLabel(key: string): string {
  return credentialLabels[props.provider.providerId]?.[key]?.label || key
}

function getPlaceholder(key: string): string {
  return credentialLabels[props.provider.providerId]?.[key]?.placeholder || ''
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
          :model-value="provider.credentials[key as string]"
          :type="isSecret(key as string) ? 'password' : 'text'"
          :placeholder="getPlaceholder(key as string)"
          class="w-full max-w-lg"
          @update:model-value="emit('update:credential', key as string, $event as string)"
        />
      </UFormField>
    </div>
  </UPageCard>
</template>
