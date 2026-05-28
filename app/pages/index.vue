<script setup lang="ts">
import { sub } from 'date-fns'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import type { Period, Range } from '~/types'
import HomeTopProductsCard from '~/components/home/HomeTopProductsCard.vue'

const config = useRuntimeConfig()
const token = useCookie('auth_token')

type RangePreset = '7d' | '30d' | '90d' | 'custom'

const activePreset = ref<RangePreset>('7d')
const range = shallowRef<Range>({
  start: sub(new Date(), { days: 7 }),
  end: new Date()
})
const period = ref<Period>('daily')
const chartCurrency = ref('RUB')

const rangePresets: { label: string, value: RangePreset, days?: number }[] = [
  { label: '7 дней', value: '7d', days: 7 },
  { label: '30 дней', value: '30d', days: 30 },
  { label: '90 дней', value: '90d', days: 90 },
  { label: 'Свой', value: 'custom' }
]

function toCalendarDate(d: Date): CalendarDate {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

const customRange = shallowRef({
  start: toCalendarDate(sub(new Date(), { days: 7 })),
  end: toCalendarDate(new Date())
})

watch(customRange, (val) => {
  if (!val?.start || !val?.end) return
  const tz = getLocalTimeZone()
  const start = val.start.toDate(tz)
  const end = val.end.toDate(tz)
  end.setHours(23, 59, 59, 999)
  range.value = { start, end }
  activePreset.value = 'custom'
})

function applyPreset(preset: typeof rangePresets[number]) {
  if (preset.value === 'custom') return
  activePreset.value = preset.value
  range.value = {
    start: sub(new Date(), { days: preset.days! }),
    end: new Date()
  }
}

const { load: loadSummary } = useStatsSummary()
watch(
  [range, chartCurrency],
  () => loadSummary(range.value.start, range.value.end, chartCurrency.value || undefined),
  { immediate: true }
)

const currencyOptions = [
  { label: '₽ RUB', value: 'RUB' },
  { label: '$ USD', value: 'USD' },
  { label: '€ EUR', value: 'EUR' }
]

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

const currencySymbol = computed(() => currencySymbols[chartCurrency.value] || '₽')

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
        <template #right>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <template
                v-for="preset in rangePresets"
                :key="preset.value"
              >
                <UPopover v-if="preset.value === 'custom'">
                  <UButton
                    :label="preset.label"
                    :variant="activePreset === preset.value ? 'soft' : 'ghost'"
                    :color="activePreset === preset.value ? 'primary' : 'neutral'"
                    size="xs"
                    icon="i-lucide-calendar"
                  />
                  <template #content>
                    <UCalendar
                      v-model="customRange"
                      range
                      :number-of-months="2"
                      class="p-2"
                    />
                  </template>
                </UPopover>
                <UButton
                  v-else
                  :label="preset.label"
                  :variant="activePreset === preset.value ? 'soft' : 'ghost'"
                  :color="activePreset === preset.value ? 'primary' : 'neutral'"
                  size="xs"
                  @click="applyPreset(preset)"
                />
              </template>
            </div>

            <div class="h-5 w-px bg-default" />

            <div class="flex items-center gap-1">
              <UButton
                v-for="opt in currencyOptions"
                :key="opt.value"
                :label="opt.label"
                :variant="chartCurrency === opt.value ? 'soft' : 'ghost'"
                :color="chartCurrency === opt.value ? 'primary' : 'neutral'"
                size="xs"
                @click="chartCurrency = opt.value"
              />
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <HomeStats />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeMetricChart
          title="Выручка"
          metric="amount"
          :period="period"
          :range="range"
          :currency="chartCurrency || undefined"
          :formatter="(n) => `${n.toLocaleString('ru-RU')} ${currencySymbol}`"
        />
        <HomeMetricChart
          title="Покупки"
          metric="count"
          :period="period"
          :range="range"
          :currency="chartCurrency || undefined"
          :formatter="(n) => `${n.toLocaleString('ru-RU')} шт.`"
          color="var(--ui-success)"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <HomeProvidersCard />
        <HomeTopProductsCard />
        <HomeTopCustomersCard
          :range="range"
          :currency="chartCurrency || undefined"
        />
      </div>

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
