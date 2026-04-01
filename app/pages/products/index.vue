<script setup lang="ts">
import type { Product, ProductType, Currency } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const showCreate = ref(false)
const showEdit = ref(false)
const editingProduct = ref<Product | null>(null)

function authHeaders() {
  return { Authorization: `Bearer ${token.value}` }
}

// Product type config
const productTypes: { value: ProductType, label: string, icon: string }[] = [
  { value: 'item', label: 'Предмет', icon: 'i-lucide-box' },
  { value: 'privilege', label: 'Привилегия', icon: 'i-lucide-crown' },
  { value: 'currency', label: 'Валюта', icon: 'i-lucide-coins' },
  { value: 'other', label: 'Другое', icon: 'i-lucide-package' }
]

const currencies: { value: Currency, label: string }[] = [
  { value: 'RUB', label: '₽ RUB' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' }
]

function getTypeLabel(type: ProductType) {
  return productTypes.find(t => t.value === type)?.label ?? type
}

function getTypeIcon(type: ProductType) {
  return productTypes.find(t => t.value === type)?.icon ?? 'i-lucide-package'
}

function getCurrencySymbol(currency: Currency) {
  const map: Record<Currency, string> = { RUB: '₽', USD: '$', EUR: '€' }
  return map[currency] ?? currency
}

// Fetch products from API
const products = ref<Product[]>([])
const loading = ref(true)

async function fetchProducts() {
  loading.value = true
  try {
    products.value = await $fetch<Product[]>('/products', {
      baseURL: config.public.apiBase as string
    })
  } catch {
    toast.add({ title: 'Ошибка загрузки', description: 'Не удалось загрузить товары.', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchProducts)

// Search / filter
const search = ref('')
const filterType = ref<ProductType | 'all'>('all')

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    if (filterType.value !== 'all' && p.type !== filterType.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    }
    return true
  })
})

// Table columns
const columns: TableColumn<Product>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'type', header: 'Тип' },
  { accessorKey: 'price', header: 'Цена' },
  { accessorKey: 'quantity', header: 'Кол-во' },
  { accessorKey: 'actions', header: '' }
]

// Delete
async function deleteProduct(id: string) {
  try {
    await $fetch(`/products/${id}`, {
      baseURL: config.public.apiBase as string,
      method: 'DELETE',
      headers: authHeaders()
    })
    products.value = products.value.filter(p => p.id !== id)
    toast.add({ title: 'Товар удалён', icon: 'i-lucide-trash-2', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось удалить товар.', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

// Duplicate
async function duplicateProduct(id: string) {
  try {
    const duplicated = await $fetch<Product>(`/products/${id}/duplicate`, {
      baseURL: config.public.apiBase as string,
      method: 'POST',
      headers: authHeaders()
    })
    products.value.unshift(duplicated)
    toast.add({ title: 'Товар дублирован', icon: 'i-lucide-copy', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось дублировать товар.', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

// Edit
function openEdit(product: Product) {
  editingProduct.value = { ...product }
  showEdit.value = true
}

function onUpdated(updated: Product) {
  const idx = products.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) products.value[idx] = updated
  showEdit.value = false
}

// Dropdown actions
function getActions(product: Product) {
  return [[{
    label: 'Редактировать',
    icon: 'i-lucide-pencil',
    onSelect: () => openEdit(product)
  }, {
    label: 'Дублировать',
    icon: 'i-lucide-copy',
    onSelect: () => duplicateProduct(product.id)
  }], [{
    label: 'Удалить',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => deleteProduct(product.id)
  }]]
}
</script>

<template>
  <UDashboardPanel id="products">
    <template #header>
      <UDashboardNavbar title="Товары">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Добавить товар"
            icon="i-lucide-plus"
            @click="showCreate = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div
        v-if="loading"
        class="flex items-center justify-center py-16"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <template v-else>
        <!-- Toolbar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Поиск товаров..."
            class="w-full sm:max-w-xs"
          />

          <div class="flex flex-wrap gap-2">
            <UButton
              label="Все"
              :variant="filterType === 'all' ? 'solid' : 'soft'"
              :color="filterType === 'all' ? 'primary' : 'neutral'"
              size="sm"
              @click="filterType = 'all'"
            />
            <UButton
              v-for="pt in productTypes"
              :key="pt.value"
              :label="pt.label"
              :icon="pt.icon"
              :variant="filterType === pt.value ? 'solid' : 'soft'"
              :color="filterType === pt.value ? 'primary' : 'neutral'"
              size="sm"
              @click="filterType = pt.value"
            />
          </div>
        </div>

        <!-- Table -->
        <UTable
          v-if="filteredProducts.length > 0"
          :data="filteredProducts"
          :columns="columns"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-lg bg-elevated border border-default flex items-center justify-center shrink-0">
                <UIcon
                  :name="getTypeIcon(row.original.type)"
                  class="size-5 text-primary"
                />
              </div>
              <div>
                <p class="font-medium">
                  {{ row.original.name }}
                </p>
                <p class="text-sm text-muted truncate max-w-xs">
                  {{ row.original.description }}
                </p>
              </div>
            </div>
          </template>

          <template #type-cell="{ row }">
            <UBadge
              :label="getTypeLabel(row.original.type)"
              variant="subtle"
              size="sm"
            />
          </template>

          <template #price-cell="{ row }">
            <span class="font-semibold tabular-nums">
              {{ row.original.price.toLocaleString() }} {{ getCurrencySymbol(row.original.currency) }}
            </span>
          </template>

          <template #quantity-cell="{ row }">
            <span class="tabular-nums text-muted">
              × {{ row.original.quantity.toLocaleString() }}
            </span>
          </template>

          <template #actions-cell="{ row }">
            <UDropdownMenu :items="getActions(row.original)">
              <UButton
                icon="i-lucide-ellipsis"
                variant="ghost"
                color="neutral"
                size="sm"
                square
              />
            </UDropdownMenu>
          </template>
        </UTable>

        <!-- Empty state -->
        <div
          v-if="filteredProducts.length === 0"
          class="text-center py-16"
        >
          <UIcon
            name="i-lucide-package-x"
            class="size-12 text-muted/30 mx-auto"
          />
          <p class="mt-3 text-muted">
            {{ search || filterType !== 'all' ? 'Товары не найдены' : 'У вас пока нет товаров' }}
          </p>
          <UButton
            v-if="!search && filterType === 'all'"
            label="Создать первый товар"
            icon="i-lucide-plus"
            class="mt-4"
            @click="showCreate = true"
          />
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <!-- Create Product Slideover -->
  <ProductCreateSlideover
    v-model:open="showCreate"
    :product-types="productTypes"
    :currencies="currencies"
    @created="(p: Product) => { products.unshift(p); showCreate = false }"
  />

  <!-- Edit Product Slideover -->
  <ProductEditSlideover
    v-if="editingProduct"
    v-model:open="showEdit"
    :product="editingProduct"
    :product-types="productTypes"
    :currencies="currencies"
    @updated="onUpdated"
  />
</template>
