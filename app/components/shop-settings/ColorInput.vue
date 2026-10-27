<script setup lang="ts">
const model = defineModel<string>({ default: '' })

defineProps<{
  format?: 'hex' | 'tailwind'
}>()

const tailwindColors: Record<string, string> = {
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e'
}

const colorNames = Object.keys(tailwindColors)

const colorItems = colorNames.map(color => ({
  label: color.charAt(0).toUpperCase() + color.slice(1),
  value: color
}))

const picker = computed({
  get: () => model.value || undefined,
  set: (value: string | undefined) => {
    model.value = value ?? ''
  }
})

function pick(color: string) {
  model.value = color
}
</script>

<template>
  <div v-if="format === 'tailwind'">
    <USelectMenu
      v-model="model"
      :items="colorItems"
      value-key="value"
      placeholder="Выберите цвет"
      class="w-full max-w-xs"
    >
      <template #leading>
        <span
          class="size-3 rounded-full shrink-0"
          :style="{ backgroundColor: tailwindColors[model] }"
        />
      </template>
    </USelectMenu>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="color in colorNames"
        :key="color"
        type="button"
        class="size-8 rounded-lg transition-all duration-150 cursor-pointer"
        :class="model === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-default scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'"
        :style="{ backgroundColor: tailwindColors[color] }"
        :title="color.charAt(0).toUpperCase() + color.slice(1)"
        @click="pick(color)"
      />
    </div>
  </div>

  <div
    v-else
    class="flex items-center gap-2"
  >
    <UPopover>
      <UButton
        color="neutral"
        variant="outline"
        square
      >
        <span
          class="block size-5 rounded border border-default"
          :style="{ backgroundColor: model || 'transparent' }"
        />
      </UButton>

      <template #content>
        <UColorPicker
          v-model="picker"
          class="p-2"
        />
      </template>
    </UPopover>

    <UInput
      v-model="model"
      placeholder="#0ea5e9"
      class="w-32 font-mono"
    />
  </div>
</template>
