<script setup lang="ts">
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const currencySymbols: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€'
}

interface RevenueByCurrency {
  currency: string
  total: number
  commission: number
  provider: number
}

interface StatsResponse {
  revenueByCurrency: RevenueByCurrency[]
  totalPayments: number
  totalCustomers: number
}

const { data: apiStats } = await useAsyncData<StatsResponse>('dashboard-stats', () =>
  $fetch<StatsResponse>('/stats', {
    baseURL: config.public.apiBase as string,
    headers: { Authorization: `Bearer ${token.value}` }
  }),
{ default: () => ({ revenueByCurrency: [], totalPayments: 0, totalCustomers: 0 }) }
)

function formatRevenue(items: RevenueByCurrency[]): string {
  if (items.length === 0) return '0'
  return items
    .map(r => `${r.total.toLocaleString('ru-RU')}${currencySymbols[r.currency] || r.currency}`)
    .join(' / ')
}

function formatCommission(items: RevenueByCurrency[]): string {
  const withCommission = items.filter(r => r.commission > 0)
  if (withCommission.length === 0) return '0'
  return withCommission
    .map(r => `${r.commission.toLocaleString('ru-RU')}${currencySymbols[r.currency] || r.currency}`)
    .join(' / ')
}
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      icon="i-lucide-users"
      title="Клиенты"
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
          {{ apiStats.totalCustomers }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-circle-dollar-sign"
      title="Выручка"
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
          {{ formatRevenue(apiStats.revenueByCurrency) }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-percent"
      title="Комиссии"
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
          {{ formatCommission(apiStats.revenueByCurrency) }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-shopping-cart"
      title="Платежей"
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
          {{ apiStats.totalPayments }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
