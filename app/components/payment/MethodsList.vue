<script setup lang="ts">
import type { PaymentMethod } from '~/types'

defineProps<{
  methods: PaymentMethod[]
}>()
</script>

<template>
  <UPageCard
    title="Методы оплаты"
    description="Включайте и настраивайте отдельные методы оплаты. У каждого метода своя комиссия."
  >
    <div class="space-y-2">
      <div
        v-for="method in methods"
        :key="method.id"
        class="flex items-center justify-between p-3 rounded-lg border border-default"
        :class="method.enabled ? 'bg-elevated' : 'opacity-60'"
      >
        <div class="flex items-center gap-3 min-w-0">
          <USwitch
            v-model="method.enabled"
            size="sm"
          />
          <span
            class="font-medium text-sm"
            :class="method.enabled ? '' : 'text-muted'"
          >{{ method.name }}</span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <UInput
            v-model.number="method.commission"
            type="number"
            :min="0"
            :max="100"
            :step="0.1"
            size="sm"
            class="w-20"
            :disabled="!method.enabled"
          />
          <span class="text-sm text-muted">%</span>
        </div>
      </div>
    </div>

    <p class="text-xs text-muted mt-3">
      Указывайте актуальные комиссии из вашего личного кабинета платёжной системы. Они могут отличаться от стандартных тарифов.
    </p>
  </UPageCard>
</template>
