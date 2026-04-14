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
  }
}

/** Providers that support test mode */
const testModeProviders = ['heleket']

const supportsTestMode = computed(() => testModeProviders.includes(props.provider.providerId))

const isTestMode = computed({
  get: () => props.provider.credentials.testMode === 'true',
  set: (val: boolean) => emit('update:credential', 'testMode', val ? 'true' : 'false')
})

/** Credential keys excluding testMode (shown separately as toggle) */
const visibleCredentialKeys = computed(() =>
  Object.keys(props.provider.credentials).filter(k => k !== 'testMode')
)

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
        v-for="key in visibleCredentialKeys"
        :key="key"
        :label="getLabel(key)"
      >
        <UInput
          :model-value="provider.credentials[key]"
          :type="isSecret(key) ? 'password' : 'text'"
          :placeholder="getPlaceholder(key)"
          class="w-full max-w-lg"
          @update:model-value="emit('update:credential', key, $event as string)"
        />
      </UFormField>

      <!-- Test mode toggle -->
      <div
        v-if="supportsTestMode"
        class="flex items-center justify-between rounded-lg border border-default p-4 mt-2"
      >
        <div>
          <p class="text-sm font-medium">
            Тестовый режим
          </p>
          <p class="text-xs text-muted mt-0.5">
            Отключает проверку IP и подписи вебхуков. Позволяет симулировать оплату из панели.
          </p>
        </div>
        <USwitch
          v-model="isTestMode"
          size="lg"
        />
      </div>

      <div
        v-if="supportsTestMode && isTestMode"
        class="flex gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
      >
        <UIcon
          name="i-lucide-triangle-alert"
          class="size-5 text-warning shrink-0 mt-0.5"
        />
        <div>
          <p class="text-sm font-medium text-warning">
            Тестовый режим включён
          </p>
          <p class="text-xs text-muted mt-0.5">
            Проверка подписи и IP-адресов вебхуков отключена. Не используйте в продакшене!
          </p>
        </div>
      </div>
    </div>
  </UPageCard>
</template>
