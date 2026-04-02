<script setup lang="ts">
import type { PaymentProvider } from '~/types'

defineProps<{
  providers: PaymentProvider[]
}>()

const selectedId = defineModel<string>('selectedId', { required: true })
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm font-medium text-muted mb-2">
      Доступные системы
    </p>

    <button
      v-for="provider in providers"
      :key="provider.id"
      type="button"
      class="w-full text-left rounded-xl border p-4 transition-all cursor-pointer"
      :class="selectedId === provider.id
        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
        : 'border-default bg-elevated hover:border-muted'"
      @click="selectedId = provider.id"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="size-10 rounded-lg flex items-center justify-center shrink-0"
            :class="provider.enabled ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'"
          >
            <UIcon
              :name="provider.icon"
              class="size-5"
            />
          </div>
          <div class="min-w-0">
            <span class="font-semibold truncate">{{ provider.name }}</span>
            <p class="text-xs text-muted truncate mt-0.5">
              {{ provider.description }}
            </p>
          </div>
        </div>
        <span
          class="size-2.5 rounded-full shrink-0 ml-3"
          :class="provider.enabled ? 'bg-green-500' : 'bg-muted/40'"
        />
      </div>
    </button>
  </div>
</template>
