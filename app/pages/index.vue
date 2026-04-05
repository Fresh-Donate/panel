<script setup lang="ts">
import { sub } from 'date-fns'
import type { Period, Range } from '~/types'

const config = useRuntimeConfig()
const token = useCookie('auth_token')

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')

interface RecentPayment {
  id: string
  customerNickname?: string
  customerEmail?: string
  productName: string
  totalAmount: number
  currency: string
  status: string
  createdAt: string
}

const currencySymbols: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€'
}

const statusLabels: Record<string, { label: string, color: string }> = {
  pending: { label: 'Ожидает', color: 'warning' },
  paid: { label: 'Оплачен', color: 'info' },
  delivered: { label: 'Выполнен', color: 'success' },
  failed: { label: 'Ошибка', color: 'error' },
  refunded: { label: 'Возврат', color: 'neutral' }
}

const { data: statsData } = await useAsyncData('dashboard-stats-full', () =>
  $fetch<{ recentPayments: RecentPayment[] }>('/stats', {
    baseURL: config.public.apiBase as string,
    headers: { Authorization: `Bearer ${token.value}` }
  }),
  { default: () => ({ recentPayments: [] }) }
)

const recentPayments = computed(() => statsData.value.recentPayments || [])

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const columns = [
  { accessorKey: 'productName', header: 'Товар' },
  { accessorKey: 'customer', header: 'Покупатель' },
  { accessorKey: 'totalAmount', header: 'Сумма' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'createdAt', header: 'Дата' }
]
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Главная">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <HomeStats />

      <HomeChart
        :period="period"
        :range="range"
      />

      <!-- Recent Payments -->
      <UPageCard
        title="Последние покупки"
        :ui="{ body: '!p-0' }"
        class="mt-6"
      >
        <UTable
          v-if="recentPayments.length > 0"
          :columns="columns"
          :data="recentPayments"
        >
          <template #productName-cell="{ row }">
            <span class="font-medium">{{ row.original.productName }}</span>
          </template>

          <template #customer-cell="{ row }">
            <div>
              <p class="font-medium">
                {{ row.original.customerNickname || '—' }}
              </p>
              <p class="text-xs text-muted">
                {{ row.original.customerEmail || '' }}
              </p>
            </div>
          </template>

          <template #totalAmount-cell="{ row }">
            <span class="font-semibold">
              {{ Number(row.original.totalAmount).toLocaleString() }}{{ currencySymbols[row.original.currency] || row.original.currency }}
            </span>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="statusLabels[row.original.status]?.label || row.original.status"
              :color="(statusLabels[row.original.status]?.color as any) || 'neutral'"
              variant="subtle"
              size="sm"
            />
          </template>

          <template #createdAt-cell="{ row }">
            <span class="text-sm text-muted">
              {{ formatDate(row.original.createdAt) }}
            </span>
          </template>
        </UTable>

        <div
          v-else
          class="text-center py-10"
        >
          <UIcon
            name="i-lucide-receipt"
            class="size-12 text-muted/20 mx-auto"
          />
          <p class="mt-3 text-sm text-muted">
            Покупок пока нет
          </p>
        </div>

        <template
          v-if="recentPayments.length > 0"
          #footer
        >
          <div class="text-center">
            <UButton
              to="/payments"
              label="Все платежи"
              variant="ghost"
              trailing-icon="i-lucide-arrow-right"
              size="sm"
            />
          </div>
        </template>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
