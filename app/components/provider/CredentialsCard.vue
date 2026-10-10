<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const url = useRuntimeConfig().public.apiBase

const props = defineProps<{
  provider: PaymentProvider
}>()

const emit = defineEmits<{
  'update:credential': [key: string, value: string]
}>()

const credentialLabels: Record<string, Record<string, { label: string, placeholder: string }>> = {
  yookassa: {
    shopId: { label: 'Shop ID', placeholder: 'Из личного кабинета ЮKassa' },
    secretKey: { label: 'Секретный ключ', placeholder: '' }
  },
  heleket: {
    apiKey: { label: 'API Key', placeholder: 'Из личного кабинета Heleket' },
    merchantId: { label: 'Merchant ID', placeholder: '' }
  },
  cryptobot: {
    apiToken: { label: 'API Token', placeholder: '@CryptoBot → Crypto Pay → Create App' }
  },
  wata: {
    apiKey: { label: 'Access Token', placeholder: 'JWT-токен из кабинета Wata (prod или sandbox)' }
  },
  robokassa: {
    merchantLogin: { label: 'Merchant Login', placeholder: 'Идентификатор магазина в Robokassa' },
    password1: { label: 'Пароль #1', placeholder: '' },
    password2: { label: 'Пароль #2', placeholder: '' }
  },
  tebex: {
    webstoreToken: { label: 'Webstore Token', placeholder: 'Webstore Builder → API Keys' },
    privateKey: { label: 'Private Key', placeholder: '' },
    webhookSecret: { label: 'Webhook Secret', placeholder: 'Developers → Webhooks → Endpoints' }
  }
}

const webhookUrls: Record<string, string> = {
  yookassa: `Магазин в ЮKassa → Интеграция → HTTP-уведомления: ${url}/webhooks/yookassa`,
  heleket: `При создании мерчанта Heleket укажите ${url}/webhooks/heleket`,
  cryptobot: `@CryptoBot → Crypto Pay → My Apps → приложение → Webhooks: ${url}/webhooks/cryptobot`,
  wata: `В терминале WATA укажите webhook ${url}/webhooks/wata`,
  robokassa: `Robokassa → Технические настройки → ResultURL: ${url}/webhooks/robokassa, метод POST, алгоритм хеша SHA256.`,
  tebex: `В Tebex Dashboard укажите webhook ${url}/webhooks/tebex`
}

function getLabel(key: string): string {
  return credentialLabels[props.provider.providerId]?.[key]?.label || key
}

function isSecret(key: string): boolean {
  return key in props.provider.secretCredentials
}

function isStored(key: string): boolean {
  return props.provider.secretCredentials[key] === true
}

function getPlaceholder(key: string): string {
  if (isStored(key)) return '••••••••'
  return credentialLabels[props.provider.providerId]?.[key]?.placeholder || ''
}
</script>

<template>
  <UPageCard
    title="Подключение"
  >
    <div class="space-y-4">
      <UFormField
        v-for="(_, key) in provider.credentials"
        :key="key"
        :label="getLabel(key as string)"
        :help="isStored(key as string) ? 'Сохранено. Новое значение заменит текущее' : undefined"
      >
        <UInput
          :model-value="provider.credentials[key as string]"
          :type="isSecret(key as string) ? 'password' : 'text'"
          :autocomplete="isSecret(key as string) ? 'new-password' : 'off'"
          :placeholder="getPlaceholder(key as string)"
          class="w-full max-w-lg"
          @update:model-value="emit('update:credential', key as string, $event as string)"
        />
      </UFormField>
      <UAlert
        icon="i-lucide-info"
        color="info"
        variant="subtle"
        title="Добавьте webhook"
        :description="webhookUrls[provider.providerId]"
      />
    </div>
  </UPageCard>
</template>
