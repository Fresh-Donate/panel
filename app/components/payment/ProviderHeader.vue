<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const props = defineProps<{
  provider: PaymentProvider
}>()

const emit = defineEmits<{
  'update:enabled': [value: boolean]
}>()

const enabledMethodsCount = computed(() =>
  props.provider.methods.filter(m => m.enabled).length
)

const avgCommission = computed(() => {
  const enabled = props.provider.methods.filter(m => m.enabled)
  if (enabled.length === 0) return 0
  return +(enabled.reduce((sum, m) => sum + m.commission, 0) / enabled.length).toFixed(2)
})
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
        @update:model-value="emit('update:enabled', $event)"
      />
    </div>

    <div
      v-if="provider.enabled"
      class="flex gap-6 mt-4 pt-4 border-t border-default"
    >
      <div>
        <p class="text-xs text-muted">
          Методов включено
        </p>
        <p class="text-lg font-bold">
          {{ enabledMethodsCount }} / {{ provider.methods.length }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted">
          Средняя комиссия
        </p>
        <p class="text-lg font-bold">
          {{ avgCommission }}%
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
  </UPageCard>
</template>
