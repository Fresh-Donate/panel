<script setup lang="ts">
import { PAYMENT_STATUSES } from '~/types'
import type { TableColumn } from '@nuxt/ui'
import type { Paginated, Payment, PaymentStatus } from '~/types'

const api = useApi()
const notify = useNotify()

const fetching = ref(true)
const payments = ref<Payment[]>([])
const total = ref(0)
const search = ref('')
const statusFilter = ref<PaymentStatus | ''>('')
const page = ref(1)
const pageSize = 20

const selected = ref<Payment | null>(null)

const statuses = [
  { label: 'Все', value: '' },
  ...Object.entries(PAYMENT_STATUSES).map(([value, { label }]) => ({ label, value }))
]

async function fetchPayments() {
  fetching.value = true
  try {
    const data = await api<Paginated<Payment>>('/payments', {
      query: {
        search: search.value || undefined,
        status: statusFilter.value || undefined,
        limit: pageSize,
        offset: (page.value - 1) * pageSize
      }
    })
    payments.value = data.items
    total.value = data.total
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить платежи.', 'Ошибка загрузки')
  } finally {
    fetching.value = false
  }
}

function resetPage() {
  if (page.value === 1) fetchPayments()
  else page.value = 1
}

onMounted(fetchPayments)
watchDebounced(search, resetPage, { debounce: 300 })
watch(statusFilter, resetPage)
watch(page, fetchPayments)

const totalPages = computed(() => Math.ceil(total.value / pageSize))

async function selectPayment(id: string) {
  try {
    selected.value = await api<Payment>(`/payments/${id}`)
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить платёж.')
  }
}

const columns: TableColumn<Payment>[] = [
  { accessorKey: 'productName', header: 'Товар' },
  { accessorKey: 'customer', header: 'Покупатель' },
  { accessorKey: 'totalAmount', header: 'Сумма' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'createdAt', header: 'Дата' },
  { accessorKey: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel
    id="payments"
    grow
  >
    <template #header>
      <UDashboardNavbar title="Платежи">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <UInput
          v-model="search"
          placeholder="Поиск по нику, почте, товару..."
          icon="i-lucide-search"
          class="w-64"
        />
        <USelectMenu
          v-model="statusFilter"
          :items="statuses"
          value-key="value"
          placeholder="Статус"
          class="w-40"
        />
        <span class="text-sm text-muted ml-auto">Всего: {{ total }}</span>
      </div>

      <!-- Loading -->
      <div
        v-if="fetching"
        class="flex items-center justify-center py-12 h-[960px]"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <!-- Table -->
      <UTable
        v-else-if="payments.length > 0"
        :columns="columns"
        :data="payments"
        class="h-[960px]"
      >
        <template #productName-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ row.original.productName }}</span>
            <UBadge
              v-if="row.original.itemsCount > 1"
              :label="`+${row.original.itemsCount - 1}`"
              color="primary"
              variant="subtle"
              size="xs"
              :title="`Заказ из ${row.original.itemsCount} товаров`"
            />
          </div>
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
          <span class="text-sm text-muted">{{ formatDateTime(row.original.createdAt) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <UButton
            icon="i-lucide-eye"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="selectPayment(row.original.id)"
          />
        </template>
      </UTable>

      <!-- Empty -->
      <div
        v-else
        class="text-center py-16 h-[960px]"
      >
        <UIcon
          name="i-lucide-receipt"
          class="size-16 text-muted/20 mx-auto"
        />
        <p class="mt-4 text-muted">
          Платежей пока нет
        </p>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex justify-center mt-6"
      >
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="pageSize"
        />
      </div>
    </template>
  </UDashboardPanel>

  <PaymentsDetailPanel
    v-if="selected"
    v-model:payment="selected"
    @close="selected = null"
    @changed="fetchPayments"
  />
</template>
