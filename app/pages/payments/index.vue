<script setup lang="ts">
interface PaymentItem {
  id: string
  customerId: string
  customerNickname?: string
  customerEmail?: string
  productName: string
  productPrice: number
  currency: string
  totalAmount: number
  status: string
  paidAt: string | null
  createdAt: string
}

const config = useRuntimeConfig()
const token = useCookie('auth_token')
const toast = useToast()

const fetching = ref(true)
const payments = ref<PaymentItem[]>([])
const total = ref(0)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = 20

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

const statuses = [
  { label: 'Все', value: '' },
  { label: 'Ожидает', value: 'pending' },
  { label: 'Оплачен', value: 'paid' },
  { label: 'Выполнен', value: 'delivered' },
  { label: 'Ошибка', value: 'failed' },
  { label: 'Возврат', value: 'refunded' }
]

async function fetchPayments() {
  fetching.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    if (statusFilter.value) params.set('status', statusFilter.value)
    params.set('limit', String(pageSize))
    params.set('offset', String((page.value - 1) * pageSize))

    const data = await $fetch<{ items: PaymentItem[], total: number }>(`/payments?${params}`, {
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    payments.value = data.items
    total.value = data.total
  } catch {
    toast.add({
      title: 'Ошибка загрузки',
      description: 'Не удалось загрузить платежи.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    fetching.value = false
  }
}

onMounted(fetchPayments)

watch([search, statusFilter], () => {
  page.value = 1
  fetchPayments()
})

watch(page, fetchPayments)

const totalPages = computed(() => Math.ceil(total.value / pageSize))

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
  <UDashboardPanel id="payments">
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
        <span class="text-sm text-muted ml-auto">
          Всего: {{ total }}
        </span>
      </div>

      <!-- Loading -->
      <div
        v-if="fetching"
        class="flex items-center justify-center py-12"
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

      <!-- Empty -->
      <div
        v-else
        class="text-center py-16"
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
          v-model="page"
          :total="total"
          :items-per-page="pageSize"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
