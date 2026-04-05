<script setup lang="ts">
import type { Stat } from '~/types'

const config = useRuntimeConfig()
const token = useCookie('auth_token')

interface StatsResponse {
  totalRevenue: number
  totalPayments: number
  totalCustomers: number
}

const { data: apiStats } = await useAsyncData<StatsResponse>('dashboard-stats', () =>
  $fetch<StatsResponse>('/stats', {
    baseURL: config.public.apiBase as string,
    headers: { Authorization: `Bearer ${token.value}` }
  }),
  { default: () => ({ totalRevenue: 0, totalPayments: 0, totalCustomers: 0 }) }
)

const stats = computed<Stat[]>(() => [
  {
    title: 'Клиенты',
    icon: 'i-lucide-users',
    value: apiStats.value.totalCustomers,
    variation: 0
  },
  {
    title: 'Выручка',
    icon: 'i-lucide-circle-dollar-sign',
    value: `${apiStats.value.totalRevenue.toLocaleString('ru-RU')}₽`,
    variation: 0
  },
  {
    title: 'Платежей',
    icon: 'i-lucide-shopping-cart',
    value: apiStats.value.totalPayments,
    variation: 0
  }
])
</script>

<template>
  <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
