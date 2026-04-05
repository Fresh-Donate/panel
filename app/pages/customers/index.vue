<script setup lang="ts">
interface CustomerItem {
  id: string
  nickname: string
  email: string
  totalSpent: number
  purchaseCount: number
  createdAt: string
}

const config = useRuntimeConfig()
const token = useCookie('auth_token')
const toast = useToast()

const fetching = ref(true)
const customers = ref<CustomerItem[]>([])
const total = ref(0)
const search = ref('')
const page = ref(1)
const pageSize = 20

async function fetchCustomers() {
  fetching.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    params.set('limit', String(pageSize))
    params.set('offset', String((page.value - 1) * pageSize))

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
  { accessorKey: 'nickname', header: 'Никнейм' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'purchaseCount', header: 'Покупок' },
  { accessorKey: 'totalSpent', header: 'Потрачено' },
  { accessorKey: 'createdAt', header: 'Зарегистрирован' }
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
          <span>{{ row.original.purchaseCount }}</span>
        </template>

        <template #totalSpent-cell="{ row }">
          <span class="font-semibold">
            {{ Number(row.original.totalSpent).toLocaleString() }}₽
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
