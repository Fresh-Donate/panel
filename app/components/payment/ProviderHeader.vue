<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const props = defineProps<{
  provider: PaymentProvider
}>()

const saving = defineModel<boolean>('saving', { required: true })

const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:testMode': [value: boolean]
}>()

// Providers that support a dedicated test / sandbox environment.
const PROVIDERS_WITH_SANDBOX = ['wata', 'cryptobot']
const supportsTestMode = computed(() =>
  PROVIDERS_WITH_SANDBOX.includes(props.provider.providerId)
)
</script>

<template>
  <UPageCard>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div
          class="size-12 rounded-xl flex items-center justify-center"
          :class="provider.enabled ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'"
        >
          <UIcon
            :name="provider.icon"
            class="size-6"
          />
        </div>
        <div>
          <h3 class="text-lg font-bold">
            {{ provider.name }}
          </h3>
          <p class="text-sm text-muted">
            {{ provider.description }}
          </p>
        </div>
      </div>
      <USwitch
        :model-value="provider.enabled"
        :loading="saving"
        @update:model-value="emit('update:enabled', $event)"
      />
    </div>

    <div
      v-if="provider.enabled"
      class="flex gap-6 mt-4 pt-4 border-t border-default"
    >
      <div>
        <p class="text-xs text-muted">
          Комиссия по умолчанию
        </p>
        <p class="text-lg font-bold">
          {{ provider.commissionPercent }}%
        </p>
      </div>
      <div>
        <p class="text-xs text-muted">
          Валюты
        </p>
        <p class="text-lg font-bold">
          {{ provider.supportedCurrencies.join(', ') }}
        </p>
      </div>
    </div>

    <div
      v-if="provider.enabled && supportsTestMode"
      class="flex items-center justify-between mt-4 pt-4 border-t border-default"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-flask-conical"
          class="size-5"
          :class="provider.testMode ? 'text-warning' : 'text-muted'"
        />
        <div>
          <p class="text-sm font-medium">
            Тестовый режим
          </p>
          <p class="text-xs text-muted">
            Запросы пойдут в sandbox платёжной системы. Реальные деньги не списываются.
          </p>
        </div>
      </div>
      <USwitch
        :model-value="provider.testMode"
        @update:model-value="emit('update:testMode', $event)"
      />
    </div>
  </UPageCard>
</template>
