<script setup lang="ts">
import type { DeliveryLog } from '~/types'

defineProps<{
  logs: DeliveryLog[]
  faded?: boolean
}>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(log, index) in logs"
      :key="index"
      class="rounded-lg border border-default p-3"
      :class="{ 'opacity-60': faded }"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium">
          Попытка {{ log.attempt }}
          <span
            v-if="log.serverId"
            class="text-muted font-normal"
          >· {{ log.serverId }}</span>
        </span>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-muted">{{ formatDateTime(log.timestamp, { seconds: true }) }}</span>
          <UBadge
            :label="log.success ? 'OK' : 'Ошибка'"
            :color="log.success ? 'success' : 'error'"
            variant="subtle"
            size="xs"
          />
        </div>
      </div>

      <div
        v-if="log.error"
        class="rounded bg-error/10 p-2"
      >
        <p class="text-xs font-mono text-error">
          {{ log.error }}
        </p>
      </div>

      <div
        v-if="log.results"
        class="space-y-1.5"
      >
        <div
          v-for="(result, i) in log.results"
          :key="i"
          class="rounded bg-elevated p-2"
        >
          <div class="flex items-start gap-2">
            <UIcon
              :name="result.success ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              :class="result.success ? 'text-success' : 'text-error'"
              class="size-3.5 mt-0.5 shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-mono font-medium">
                {{ result.command }}
              </p>
              <p
                v-if="result.response"
                class="text-xs font-mono text-muted mt-0.5"
              >
                {{ result.response }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
