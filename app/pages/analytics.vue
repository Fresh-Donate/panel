<script setup lang="ts">
import { sub } from 'date-fns'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import { PAYMENT_STATUSES } from '~/types'
import type { TableColumn } from '@nuxt/ui'
import type { Currency, Period, Range, RecentPayment } from '~/types'

const api = useApi()

type RangePreset = '7d' | '30d' | '90d' | 'custom'

const activePreset = ref<RangePreset>('7d')
const range = shallowRef<Range>({
  start: sub(new Date(), { days: 7 }),
  end: new Date()
})
const period = ref<Period>('daily')
const chartCurrency = ref<Currency>('RUB')

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

function setChartCurrency(currency: Currency) {
  chartCurrency.value = currency
}

function applyPreset(preset: typeof rangePresets[number]) {
  if (preset.value === 'custom') return
  activePreset.value = preset.value
  range.value = {
    start: sub(new Date(), { days: preset.days ?? 7 }),
    end: new Date()
  }
}

const { load: loadSummary } = useStatsSummary()
watch(
  [range, chartCurrency],
  () => loadSummary(range.value.start, range.value.end, chartCurrency.value || undefined),
  { immediate: true }
)

const { data: statsData } = await useAsyncData(
  'dashboard-stats-full',
  () => api<{ recentPayments: RecentPayment[] }>('/stats'),
  { default: () => ({ recentPayments: [] }) }
)

const recentPayments = computed(() => statsData.value.recentPayments || [])

const columns: TableColumn<RecentPayment>[] = [
  { accessorKey: 'productName', header: 'Товар' },
  { accessorKey: 'customer', header: 'Покупатель' },
  { accessorKey: 'totalAmount', header: 'Сумма' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'createdAt', header: 'Дата' }
]
</script>

<template>
  <UDashboardPanel id="analytics">
    <template #header>
      <UDashboardNavbar title="Аналитика">
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
                    :label="$device.isMobile ? undefined : preset.label"
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
                  :label="$device.isMobile ? `${preset.days}` : preset.label"
                  :variant="activePreset === preset.value ? 'soft' : 'ghost'"
                  :color="activePreset === preset.value ? 'primary' : 'neutral'"
                  size="xs"
                  @click="applyPreset(preset)"
                />
              </template>
            </div>

            <div class="h-5 w-px bg-default hidden lg:block" />

            <div class="flex items-center gap-1">
              <UButton
                v-for="opt in CURRENCY_OPTIONS"
                :key="opt.value"
                :label="$device.isMobile ? opt.label.charAt(0) : opt.label"
                :variant="chartCurrency === opt.value ? 'soft' : 'ghost'"
                :color="chartCurrency === opt.value ? 'primary' : 'neutral'"
                size="xs"
                @click="setChartCurrency(opt.value)"
              />
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <HomeAnalyticStats />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeMetricChart
          title="Выручка"
          metric="amount"
          :period="period"
          :range="range"
          :currency="chartCurrency || undefined"
          :formatter="(n) => formatMoney(n, chartCurrency)"
        />
        <HomeMetricChart
          title="Покупки"
          metric="count"
          :period="period"
          :range="range"
          :currency="chartCurrency || undefined"
          :formatter="(n) => `${formatNumber(n)} шт.`"
          color="var(--ui-success)"
        />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
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
        :ui="{ body: '!p-0', container: 'min-w-0 !block' }"
        class="max-w-full min-w-0"
      >
        <div
          v-if="recentPayments.length > 0"
          class="w-full max-w-full overflow-x-auto"
        >
          <UTable
            :columns="columns"
            :data="recentPayments"
          >
            <template #productName-cell="{ row }">
              <span class="font-medium">{{ row.original.productName }}</span>
            </template>

            <template #customer-cell="{ row }">
              <div>
                <p class="font-medium">
                  {{ row.original.customerNickname || '-' }}
                </p>
                <p class="text-xs text-muted">
                  {{ row.original.customerEmail || '' }}
                </p>
              </div>
            </template>

            <template #totalAmount-cell="{ row }">
              <span class="font-semibold">
                {{ formatMoney(row.original.totalAmount, row.original.currency) }}
              </span>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :label="PAYMENT_STATUSES[row.original.status]?.label || row.original.status"
                :color="PAYMENT_STATUSES[row.original.status]?.color || 'neutral'"
                variant="subtle"
                size="sm"
              />
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-sm text-muted">
                {{ formatDateTime(row.original.createdAt) }}
              </span>
            </template>
          </UTable>
        </div>

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
