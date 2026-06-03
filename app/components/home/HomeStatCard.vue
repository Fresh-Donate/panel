<script setup lang="ts">
import { VisXYContainer, VisLine, VisArea } from '@unovis/vue'

const props = defineProps<{
  icon: string
  label: string
  current: number
  previous: number
  sparkline: number[]
  formatter?: (n: number) => string
}>()

const trend = computed(() => {
  const diff = props.current - props.previous
  const pct = props.previous > 0
    ? Math.round((diff / props.previous) * 100)
    : (props.current > 0 ? 100 : 0)
  return {
    pct,
    icon: diff > 0
      ? 'i-lucide-arrow-up'
      : diff < 0
        ? 'i-lucide-arrow-down'
        : 'i-lucide-minus',
    color: (diff > 0 ? 'success' : diff < 0 ? 'error' : 'neutral') as 'success' | 'error' | 'neutral'
  }
})

const displayValue = computed(() =>
  props.formatter ? props.formatter(props.current) : props.current
)

const sparkX = (_: number, i: number) => i
const sparkY = (d: number) => d

// Unique per-instance gradient id - иначе несколько карточек на странице
// будут писать <linearGradient> с одинаковым id, и url(#...) у всех укажет
// на первый встретившийся (валидно по HTML, но непредсказуемо при стилизации).
const gradientId = `spark-gradient-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
const svgDefs = `
  <linearGradient id="${gradientId}" gradientTransform="rotate(90)">
    <stop offset="0%" style="stop-color:var(--ui-primary);stop-opacity:0.6" />
    <stop offset="100%" style="stop-color:var(--ui-primary);stop-opacity:0" />
  </linearGradient>
`
</script>

<template>
  <UPageCard
    variant="subtle"
    :ui="{ container: 'gap-y-2' }"
    class="rounded-lg hover:z-1 overflow-hidden"
  >
    <UBadge
      :color="trend.color"
      variant="soft"
      size="sm"
      :icon="trend.icon"
      class="absolute top-2 right-2"
    >
      {{ Math.abs(trend.pct) }}%
    </UBadge>
    <div>
      <div class="flex gap-4">
        <div>
          <Icon
            :name="icon"
            class="text-5xl text-primary"
          />
        </div>
        <div class="space-y-1.5">
          <p class="font-normal text-muted text-[11px] uppercase tracking-wider">
            {{ label }}
          </p>
          <p class="text-2xl font-semibold text-highlighted leading-none">
            {{ displayValue }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="sparkline.length > 0"
      class="h-8 absolute bottom-0 w-full"
    >
      <VisXYContainer
        :data="sparkline"
        :height="32"
        :svg-defs="svgDefs"
        :padding="{ top: 3, bottom: 3 }"
      >
        <VisArea
          :x="sparkX"
          :y="sparkY"
          :color="`url(#${gradientId})`"
        />
        <VisLine
          :x="sparkX"
          :y="sparkY"
          color="var(--ui-primary)"
        />
      </VisXYContainer>
    </div>
  </UPageCard>
</template>
