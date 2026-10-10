<script setup lang="ts">
import { DECLINE_REASONS, providerName } from '~/types'

const { funnel } = useStatsFunnel()

const pct = (part: number, whole: number) => whole > 0 ? Math.round((part / whole) * 100) : 0

const providers = computed(() => {
  const f = funnel.value
  if (!f) return []
  const overall = pct(f.paid, f.attempts)
  return f.providers.map((p) => {
    const conversion = pct(p.paid, p.attempts)
    return {
      ...p,
      name: providerName(p.providerId),
      conversion,
      lagging: conversion < overall / 2,
      segments: [
        { key: 'paid', width: conversion, class: 'bg-primary' },
        { key: 'switched', width: pct(p.switched, p.attempts), class: 'bg-info/60' },
        { key: 'lost', width: pct(p.lost, p.attempts), class: 'bg-(--ui-text-dimmed)/50' }
      ],
      notes: [
        p.switched > 0 ? `оплатили другим способом: ${formatNumber(p.switched)}` : '',
        p.lost > 0 ? `ушли: ${formatNumber(p.lost)}` : ''
      ].filter(Boolean).join(' · ')
    }
  })
})

const reasons = computed(() => {
  const list = funnel.value?.declineReasons ?? []
  const max = list[0]?.count ?? 0
  return list.map(r => ({
    ...r,
    label: DECLINE_REASONS[r.reason] || r.reason,
    width: max > 0 ? (r.count / max) * 100 : 0
  }))
})
</script>

<template>
  <UCard>
    <p class="text-sm font-semibold text-highlighted">
      Оплата по провайдерам
    </p>
    <p class="text-xs text-muted mt-1">
      Оплаты через провайдера от попыток, где его выбирали
    </p>

    <div
      v-if="providers.length > 0"
      class="flex flex-col gap-3 mt-4"
    >
      <div
        v-for="p in providers"
        :key="p.providerId || 'unknown'"
      >
        <div class="flex items-baseline justify-between gap-4 mb-1 text-sm">
          <span class="text-highlighted truncate">{{ p.name }}</span>
          <span class="tabular-nums whitespace-nowrap">
            <span
              class="font-semibold"
              :class="p.lagging ? 'text-error' : 'text-highlighted'"
            >{{ p.conversion }}%</span>
            <span class="text-muted"> · {{ formatNumber(p.paid) }} из {{ formatNumber(p.attempts) }}</span>
          </span>
        </div>
        <div class="h-1.5 rounded-full bg-elevated overflow-hidden flex">
          <div
            v-for="seg in p.segments"
            :key="seg.key"
            class="h-full"
            :class="seg.class"
            :style="{ width: `${seg.width}%` }"
          />
        </div>
        <p
          v-if="p.notes"
          class="text-xs text-muted mt-1"
        >
          {{ p.notes }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="h-24 flex items-center justify-center"
    >
      <p class="text-sm text-muted">
        Нет заказов за выбранный период
      </p>
    </div>

    <template v-if="reasons.length > 0">
      <p class="text-xs text-muted uppercase mt-6 mb-2">
        Причины отказов
      </p>
      <div class="flex flex-col gap-2">
        <div
          v-for="r in reasons"
          :key="r.reason"
          class="relative flex items-center justify-between gap-4 px-2 py-1 text-sm rounded-md overflow-hidden"
        >
          <div
            class="absolute inset-y-0 left-0 bg-error/10 rounded-md"
            :style="{ width: `${r.width}%` }"
          />
          <span
            class="relative text-highlighted truncate"
            :title="r.reason"
          >{{ r.label }}</span>
          <span class="relative text-muted tabular-nums">{{ formatNumber(r.count) }}</span>
        </div>
      </div>
    </template>
  </UCard>
</template>
