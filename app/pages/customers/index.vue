<script setup lang="ts">
import { h, resolveComponent } from 'vue'

interface CustomerCurrencyStats {
  currency: string
  totalSpent: number
  purchaseCount: number
}
interface CustomerItem {
  id: string
  nickname: string
  email: string
  stats: CustomerCurrencyStats[]
  createdAt: string
  updatedAt: string
}

// Sortable columns. `totalSpent` is sorted on the server using the
// admin-configured currency rates (see "Курсы валют" in общие настройки) —
// each payment's amount is normalised to RUB before summing, so customers
// with mixed-currency stats compare correctly.
type SortableColumn = 'nickname' | 'email' | 'purchaseCount' | 'totalSpent' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const config = useRuntimeConfig()
const token = useCookie('auth_token')
const toast = useToast()

const fetching = ref(true)
const customers = ref<CustomerItem[]>([])
const total = ref(0)
const search = ref('')
const page = ref(1)
const pageSize = 20

const sortBy = ref<SortableColumn>('createdAt')
const sortOrder = ref<SortDirection>('desc')

async function fetchCustomers() {
  fetching.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    params.set('limit', String(pageSize))
    params.set('offset', String((page.value - 1) * pageSize))
    params.set('sortBy', sortBy.value)
    params.set('sortOrder', sortOrder.value)

    const data = await $fetch<{ items: CustomerItem[], total: number }>(`/customers?${params}`, {
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    customers.value = data.items
    total.value = data.total
  } catch {
    toast.add({
      title: 'Ошибка загрузки',
      description: 'Не удалось загрузить клиентов.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    fetching.value = false
  }
}

onMounted(fetchCustomers)

watch(search, () => {
  page.value = 1
  fetchCustomers()
})

watch(page, fetchCustomers)

// Clicking a column either flips the direction (if already sorted by it)
// or switches to that column with a sensible default direction. Strings go
// asc-first (A→Z), numeric / date go desc-first (newest / largest first).
function toggleSort(column: SortableColumn) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    // Strings: A→Z first feels natural. Numeric / date: largest / newest
    // first is what the admin almost always wants — top customers, latest
    // signups, etc.
    sortOrder.value = column === 'nickname' || column === 'email' ? 'asc' : 'desc'
  }
  page.value = 1
  fetchCustomers()
}

function sortIcon(column: SortableColumn): string {
  if (sortBy.value !== column) return 'i-lucide-arrow-up-down'
  return sortOrder.value === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
}

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

const UButton = resolveComponent('UButton')

// Header render functions read the sort refs at render time, so swapping
// the sort direction re-renders only the header without rebuilding columns.
function sortableHeader(column: SortableColumn, label: string) {
  return () => h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    size: 'sm',
    label,
    trailingIcon: sortIcon(column),
    class: '-mx-2 data-[state=open]:bg-elevated',
    onClick: () => toggleSort(column)
  })
}

const columns = [
  { accessorKey: 'nickname', header: sortableHeader('nickname', 'Никнейм') },
  { accessorKey: 'email', header: sortableHeader('email', 'Email') },
  { accessorKey: 'purchaseCount', header: sortableHeader('purchaseCount', 'Покупок') },
  { accessorKey: 'totalSpent', header: sortableHeader('totalSpent', 'Потрачено') },
  { accessorKey: 'createdAt', header: sortableHeader('createdAt', 'Зарегистрирован') }
]
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Клиенты">
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
          placeholder="Поиск по нику или email..."
          icon="i-lucide-search"
          class="w-64"
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
        v-else-if="customers.length > 0"
        :columns="columns"
        :data="customers"
      >
        <template #nickname-cell="{ row }">
          <span class="font-medium">{{ row.original.nickname }}</span>
        </template>

        <template #email-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.email }}</span>
        </template>

        <template #purchaseCount-cell="{ row }">
          <span>{{ row.original.stats.reduce((s, x) => s + x.purchaseCount, 0) }} шт.</span>
        </template>

        <template #totalSpent-cell="{ row }">
          <span class="font-semibold">
            {{ row.original.stats.map((s) => `${Number(s.totalSpent).toLocaleString()} ${s.currency}`).join(', ') }}
          </span>
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
          name="i-lucide-users"
          class="size-16 text-muted/20 mx-auto"
        />
        <p class="mt-4 text-muted">
          Клиентов пока нет
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
