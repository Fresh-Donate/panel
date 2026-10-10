<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const { services, load } = useServiceVersions()
onMounted(load)
</script>

<template>
  <div class="w-full">
    <div
      v-if="!collapsed && services.length > 0"
      class="p-1 text-[10px] text-muted font-mono leading-relaxed w-full"
    >
      <div
        v-for="svc in services"
        :key="svc.name"
        class="flex items-center justify-between"
      >
        <span>{{ svc.name }}</span>
        <UTooltip
          v-if="svc.outdated"
          :text="`Доступна новая версия: ${svc.latestVersion}`"
        >
          <a
            :href="`https://github.com/${svc.repo}/releases/latest`"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-1 text-warning hover:underline"
          >
            <span>{{ svc.version }}</span>
            <UIcon
              name="i-lucide-circle-arrow-up"
              class="size-3"
            />
          </a>
        </UTooltip>
        <span
          v-else
          class="text-muted/60"
        >{{ svc.version }}</span>
      </div>
    </div>
    <div
      v-if="collapsed && services.length > 0"
      class="flex justify-center items-center py-2 w-full"
    >
      <UTooltip
        :text="services.map(s => s.outdated ? `${s.name} ${s.version} → ${s.latestVersion}` : `${s.name} ${s.version}`).join(' | ')"
      >
        <UButton
          :icon="services.some(s => s.outdated) ? 'i-lucide-circle-arrow-up' : 'i-lucide-info'"
          variant="ghost"
          :color="services.some(s => s.outdated) ? 'warning' : 'neutral'"
          size="sm"
        />
      </UTooltip>
    </div>
  </div>
</template>
