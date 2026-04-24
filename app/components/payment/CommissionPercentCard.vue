<script setup lang="ts">
const commissionPercent = defineModel<number>('commissionPercent', { required: true })
</script>

<template>
  <UPageCard
    title="Комиссия платёжной системы"
    description="Процент, который платёжная система берёт по умолчанию. Используется как предварительная оценка — фактическая комиссия подставится из данных вебхука, когда платёж завершится."
  >
    <UFormField label="Комиссия, %">
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

    <p class="text-xs text-muted mt-3">
      Укажите актуальный тариф из вашего личного кабинета платёжной системы.
    </p>
  </UPageCard>
</template>
