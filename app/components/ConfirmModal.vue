<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  details?: string[]
  confirmLabel?: string
  color?: 'error' | 'warning' | 'primary'
}>(), {
  description: undefined,
  details: () => [],
  confirmLabel: 'Подтвердить',
  color: 'error'
})

const emit = defineEmits<{
  close: [confirmed: boolean]
}>()
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :close="false"
  >
    <template
      v-if="details.length > 0"
      #body
    >
      <ul class="text-sm text-muted space-y-1.5 list-disc list-inside">
        <li
          v-for="item in details"
          :key="item"
        >
          {{ item }}
        </li>
      </ul>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Отмена"
          variant="ghost"
          color="neutral"
          @click="emit('close', false)"
        />
        <UButton
          :label="confirmLabel"
          :color="color"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
