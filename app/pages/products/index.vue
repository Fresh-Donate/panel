<script setup lang="ts">
import { PRODUCT_TYPES } from '~/types'
import type { Product, ProductType, Server } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const productsStore = useProductsStore()
const settingsStore = useSettingsStore()
const { items: products } = storeToRefs(productsStore)

const showForm = ref(false)
const editingProduct = ref<Product | null>(null)
const showCreateGroup = ref(false)

const servers = ref<Server[]>([])
const multiServerEnabled = ref(false)
const loading = ref(true)

function typeOf(type: ProductType) {
  return PRODUCT_TYPES.find(t => t.value === type)
}

async function fetchMultiServerContext() {
  const settings = await settingsStore.load()
  multiServerEnabled.value = settings.multi_server_enabled
  servers.value = settings.multi_server_enabled ? await api<Server[]>('/servers') : []
}

async function fetchAll() {
  loading.value = true
  try {
    await Promise.all([productsStore.load(), fetchMultiServerContext()])
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить товары.', 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

const search = ref('')
const filterType = ref<ProductType | 'all'>('all')

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase()
  return products.value.filter((p) => {
    if (filterType.value !== 'all' && p.type !== filterType.value) return false
    return !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  })
})

const columns: TableColumn<Product>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'type', header: 'Тип' },
  { accessorKey: 'price', header: 'Цена' },
  { accessorKey: 'quantity', header: 'Кол-во' },
  { accessorKey: 'groups', header: 'Группы' },
  { accessorKey: 'actions', header: '' }
]

async function deleteProduct(product: Product) {
  const confirmed = await confirm({
    title: `Удалить товар «${product.name}»?`,
    description: 'Товар исчезнет из магазина. История платежей по нему сохранится.',
    confirmLabel: 'Удалить'
  })
  if (!confirmed) return
  try {
    await productsStore.remove(product.id)
    notify.success('Товар удалён', undefined, 'i-lucide-trash-2')
  } catch (err) {
    notify.apiError(err, 'Не удалось удалить товар.')
  }
}

async function duplicateProduct(id: string) {
  try {
    await productsStore.duplicate(id)
    notify.success('Товар дублирован', undefined, 'i-lucide-copy')
  } catch (err) {
    notify.apiError(err, 'Не удалось дублировать товар.')
  }
}

function openCreate() {
  editingProduct.value = null
  showForm.value = true
}

function openCreateGroup() {
  showCreateGroup.value = true
}

function setFilter(type: ProductType | 'all') {
  filterType.value = type
}

function openEdit(product: Product) {
  editingProduct.value = product
  showForm.value = true
}

function onSaved(product: Product) {
  productsStore.upsert(product)
  showForm.value = false
}

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
    onSelect: () => deleteProduct(product)
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
            label="Создать группу"
            icon="i-lucide-layers"
            color="neutral"
            variant="soft"
            @click="openCreateGroup"
          />
          <UButton
            label="Добавить товар"
            icon="i-lucide-plus"
            @click="openCreate"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
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
              @click="setFilter('all')"
            />
            <UButton
              v-for="pt in PRODUCT_TYPES"
              :key="pt.value"
              :label="pt.label"
              :icon="pt.icon"
              :variant="filterType === pt.value ? 'solid' : 'soft'"
              :color="filterType === pt.value ? 'primary' : 'neutral'"
              size="sm"
              @click="setFilter(pt.value)"
            />
          </div>
        </div>

        <UTable
          v-if="filteredProducts.length > 0"
          :data="filteredProducts"
          :columns="columns"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-lg bg-elevated border border-default flex items-center justify-center shrink-0">
                <UIcon
                  :name="typeOf(row.original.type)?.icon ?? 'i-lucide-package'"
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
              :label="typeOf(row.original.type)?.label ?? row.original.type"
              variant="subtle"
              size="sm"
            />
          </template>

          <template #price-cell="{ row }">
            <span class="font-semibold tabular-nums">
              {{ formatMoney(row.original.price, row.original.currency) }}
            </span>
          </template>

          <template #quantity-cell="{ row }">
            <span class="tabular-nums text-muted">
              × {{ formatNumber(row.original.quantity) }}
            </span>
          </template>

          <template #groups-cell="{ row }">
            <div
              v-if="!row.original.groups || row.original.groups.length === 0"
              class="text-xs text-muted"
            >
              Нет
            </div>
            <div
              v-else
              class="flex flex-wrap gap-1 max-w-xs"
            >
              <UBadge
                v-for="g in row.original.groups"
                :key="g.id"
                :label="g.name"
                :icon="g.upgradeMode ? 'i-lucide-arrow-up-right' : undefined"
                :color="g.upgradeMode ? 'primary' : 'neutral'"
                variant="subtle"
                size="sm"
              />
            </div>
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
            @click="openCreate"
          />
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <ProductFormSlideover
    v-model:open="showForm"
    :product="editingProduct"
    :servers="servers"
    :multi-server-enabled="multiServerEnabled"
    @saved="onSaved"
  />

  <GroupFormSlideover
    v-model:open="showCreateGroup"
    :products="products"
    @saved="() => { showCreateGroup = false; fetchAll() }"
  />
</template>
