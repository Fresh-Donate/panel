<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { Customer, CustomerSortColumn, Paginated } from '~/types'

type SortableColumn = CustomerSortColumn
type SortDirection = 'asc' | 'desc'

const api = useApi()
const notify = useNotify()

const fetching = ref(true)
const customers = ref<Customer[]>([])
const total = ref(0)
const search = ref('')
const page = ref(1)
const pageSize = 20

const sortBy = ref<SortableColumn>('createdAt')
const sortOrder = ref<SortDirection>('desc')

async function fetchCustomers() {
  fetching.value = true
  try {
    const data = await api<Paginated<Customer>>('/customers', {
      query: {
        search: search.value || undefined,
        limit: pageSize,
        offset: (page.value - 1) * pageSize,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      }
    })
    customers.value = data.items
    total.value = data.total
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить клиентов.', 'Ошибка загрузки')
  } finally {
    fetching.value = false
  }
}

onMounted(fetchCustomers)

watchDebounced(search, () => {
  if (page.value === 1) fetchCustomers()
  else page.value = 1
}, { debounce: 300 })

watch(page, fetchCustomers)

function toggleSort(column: SortableColumn) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = column === 'nickname' || column === 'email' ? 'asc' : 'desc'
  }
  if (page.value === 1) fetchCustomers()
  else page.value = 1
}

function sortIcon(column: SortableColumn): string {
  if (sortBy.value !== column) return 'i-lucide-arrow-up-down'
  return sortOrder.value === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
}

const totalPages = computed(() => Math.ceil(total.value / pageSize))

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

      <div
        v-if="fetching"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

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
            {{ row.original.stats.map((s) => formatMoney(s.totalSpent, s.currency)).join(', ') }}
          </span>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-sm text-muted">
            {{ formatDateTime(row.original.createdAt) }}
          </span>
        </template>
      </UTable>

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
</template>
