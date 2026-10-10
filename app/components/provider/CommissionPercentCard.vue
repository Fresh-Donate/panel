<script setup lang="ts">
const commissionPercent = defineModel<number>('commissionPercent', { required: true })
</script>

<template>
  <UPageCard
    title="Комиссия платёжной системы"
    description="Предварительная оценка. Фактическая комиссия берётся из вебхука после оплаты."
  >
    <UFormField>
      <div class="flex items-center gap-2">
        <UInput
          v-model.number="commissionPercent"
          type="number"
          :min="0"
          :max="100"
          :step="0.1"
          class="w-32"
        />
        <span class="text-sm text-muted">%</span>
      </div>
    </UFormField>
  </UPageCard>
</template>
