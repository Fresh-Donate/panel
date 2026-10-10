<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Group } from '~/types'

defineProps<{
  group: Group | null
  count: number
  collapsed: boolean
  actions?: DropdownMenuItem[][]
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <div class="flex items-center gap-2 min-w-0">
    <UButton
      :icon="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
      color="neutral"
      variant="ghost"
      size="sm"
      class="min-w-0 font-semibold text-highlighted"
      :aria-expanded="!collapsed"
      @click="emit('toggle')"
    >
      <UIcon
        :name="group ? 'i-lucide-layers' : 'i-lucide-package-open'"
        class="size-4 shrink-0"
        :class="group ? 'text-primary' : 'text-muted'"
      />
      <span class="truncate">{{ group?.name ?? 'Без группы' }}</span>
    </UButton>

    <UBadge
      :label="formatNumber(count)"
      color="neutral"
      variant="subtle"
      size="sm"
      class="tabular-nums"
    />
    <UBadge
      v-if="group?.upgradeMode"
      label="Доплата"
      icon="i-lucide-arrow-up-right"
      variant="subtle"
      size="sm"
    />

    <UDropdownMenu
      v-if="actions"
      :items="actions"
    >
      <UButton
        icon="i-lucide-ellipsis"
        variant="ghost"
        color="neutral"
        size="sm"
        square
        class="ml-auto"
        aria-label="Действия с группой"
      />
    </UDropdownMenu>
  </div>
</template>
