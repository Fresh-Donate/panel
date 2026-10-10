<script setup lang="ts">
import { PRODUCT_TYPES } from '~/types'
import type { Group, Product, ProductSection, ProductType, Server } from '~/types'
import type { DropdownMenuItem, TabsItem } from '@nuxt/ui'

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const productsStore = useProductsStore()
const settingsStore = useSettingsStore()
const { items: products } = storeToRefs(productsStore)

const groups = ref<Group[]>([])
const servers = ref<Server[]>([])
const multiServerEnabled = ref(false)
const loading = ref(true)

const showProductForm = ref(false)
const editingProduct = ref<Product | null>(null)
const createGroupIds = ref<string[]>([])
const showGroupForm = ref(false)
const editingGroup = ref<Group | null>(null)

const UNGROUPED = 'ungrouped'

const view = useLocalStorage('fd:products:view', 'list')
const collapsedKeys = useLocalStorage<string[]>('fd:products:collapsed', [])

const viewItems: TabsItem[] = [
  { label: 'Список', icon: 'i-lucide-list', value: 'list' },
  { label: 'Карточки', icon: 'i-lucide-layout-grid', value: 'cards' }
]

async function fetchMultiServerContext() {
  const settings = await settingsStore.load()
  multiServerEnabled.value = settings.multi_server_enabled
  servers.value = settings.multi_server_enabled ? await api<Server[]>('/servers') : []
}

async function fetchAll() {
  loading.value = true
  try {
    const [groupsList] = await Promise.all([
      api<Group[]>('/groups'),
      productsStore.load(),
      fetchMultiServerContext()
    ])
    groups.value = groupsList
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить товары.', 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

const search = ref('')
const filterType = ref<ProductType | 'all'>('all')
const query = computed(() => search.value.trim().toLowerCase())
const filtersActive = computed(() => !!query.value || filterType.value !== 'all')

function matches(product: Product, q: string) {
  if (filterType.value !== 'all' && product.type !== filterType.value) return false
  return !q || product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q)
}

const sections = computed<ProductSection[]>(() => {
  const q = query.value
  const grouped = new Set<string>()
  const result: ProductSection[] = []

  for (const group of groups.value) {
    const ids = new Set(group.productIds)
    const members = products.value.filter(p => ids.has(p.id))
    members.forEach(p => grouped.add(p.id))

    const groupHit = !!q && group.name.toLowerCase().includes(q)
    const visible = members.filter(p => matches(p, groupHit ? '' : q))
    if (filtersActive.value && visible.length === 0 && !(groupHit && members.length === 0)) continue
    result.push({ key: group.id, group, products: visible })
  }

  const rest = products.value.filter(p => !grouped.has(p.id) && matches(p, q))
  if (rest.length > 0 || (groups.value.length > 0 && !filtersActive.value)) {
    result.push({ key: UNGROUPED, group: null, products: rest })
  }
  return result
})

const isEmpty = computed(() => products.value.length === 0 && groups.value.length === 0)

const collapsed = computed(() => new Set(filtersActive.value ? [] : collapsedKeys.value))

function toggleSection(key: string) {
  collapsedKeys.value = collapsedKeys.value.includes(key)
    ? collapsedKeys.value.filter(k => k !== key)
    : [...collapsedKeys.value, key]
}

function setFilter(type: ProductType | 'all') {
  filterType.value = type
}

function resetFilters() {
  search.value = ''
  filterType.value = 'all'
}

function openCreate(groupId?: string) {
  editingProduct.value = null
  createGroupIds.value = groupId ? [groupId] : []
  showProductForm.value = true
}

function openEdit(product: Product) {
  editingProduct.value = product
  showProductForm.value = true
}

function onProductSaved(product: Product) {
  productsStore.upsert(product)
  syncMembership(product)
  showProductForm.value = false
}

function groupIdsOf(productId: string) {
  return groups.value.filter(g => g.productIds.includes(productId)).map(g => g.id)
}

function applyMembership(productId: string, groupIds: string[]) {
  const ids = new Set(groupIds)
  groups.value = groups.value.map((g) => {
    const has = g.productIds.includes(productId)
    if (ids.has(g.id) === has) return g
    return { ...g, productIds: has ? g.productIds.filter(id => id !== productId) : [...g.productIds, productId] }
  })
}

function syncMembership(product: Product) {
  applyMembership(product.id, (product.groups ?? []).map(g => g.id))
}

async function moveProduct(productId: string, from: string, to: string) {
  if (from === to || !products.value.some(p => p.id === productId)) return

  const next = to === UNGROUPED
    ? []
    : [...new Set([...groupIdsOf(productId).filter(id => id !== from), to])]
  const previous = groups.value
  applyMembership(productId, next)

  try {
    const saved = await api<Product>(`/products/${productId}`, { method: 'PUT', body: { groupIds: next } })
    productsStore.upsert(saved)
    syncMembership(saved)
    const target = groups.value.find(g => g.id === to)
    notify.success(target ? `Товар перемещён в «${target.name}»` : 'Товар убран из групп', undefined, 'i-lucide-folder-input')
  } catch (err) {
    groups.value = previous
    notify.apiError(err, 'Не удалось переместить товар.')
  }
}

async function deleteProduct(product: Product) {
  const confirmed = await confirm({
    title: `Удалить товар «${product.name}»?`,
    description: 'Товар исчезнет из магазина. История платежей по нему сохранится.',
    confirmLabel: 'Удалить'
  })
  if (!confirmed) return
  try {
    await productsStore.remove(product.id)
    groups.value = groups.value.map(g => ({ ...g, productIds: g.productIds.filter(id => id !== product.id) }))
    notify.success('Товар удалён', undefined, 'i-lucide-trash-2')
  } catch (err) {
    notify.apiError(err, 'Не удалось удалить товар.')
  }
}

async function duplicateProduct(id: string) {
  try {
    syncMembership(await productsStore.duplicate(id))
    notify.success('Товар дублирован', undefined, 'i-lucide-copy')
  } catch (err) {
    notify.apiError(err, 'Не удалось дублировать товар.')
  }
}

function openCreateGroup() {
  editingGroup.value = null
  showGroupForm.value = true
}

function openEditGroup(group: Group) {
  editingGroup.value = group
  showGroupForm.value = true
}

function onGroupSaved(saved: Group) {
  const idx = groups.value.findIndex(g => g.id === saved.id)
  if (idx === -1) groups.value.unshift(saved)
  else groups.value[idx] = saved
  showGroupForm.value = false
}

async function deleteGroup(group: Group) {
  const confirmed = await confirm({
    title: `Удалить группу «${group.name}»?`,
    description: 'Товары из группы останутся, но правила доплаты для них перестанут действовать.',
    confirmLabel: 'Удалить'
  })
  if (!confirmed) return
  try {
    await api(`/groups/${group.id}`, { method: 'DELETE' })
    groups.value = groups.value.filter(g => g.id !== group.id)
    collapsedKeys.value = collapsedKeys.value.filter(k => k !== group.id)
    notify.success('Группа удалена', undefined, 'i-lucide-trash-2')
  } catch (err) {
    notify.apiError(err, 'Не удалось удалить группу.')
  }
}

function moveTargets(product: Product, from: string): DropdownMenuItem[] {
  const targets: DropdownMenuItem[] = groups.value
    .filter(g => g.id !== from)
    .map(g => ({
      label: g.name,
      icon: 'i-lucide-layers',
      onSelect: () => moveProduct(product.id, from, g.id)
    }))
  if (from !== UNGROUPED) {
    if (targets.length > 0) targets.push({ type: 'separator' })
    targets.push({
      label: 'Без группы',
      icon: 'i-lucide-package-open',
      onSelect: () => moveProduct(product.id, from, UNGROUPED)
    })
  }
  return targets
}

function productActions(product: Product, sectionKey: string): DropdownMenuItem[][] {
  const targets = moveTargets(product, sectionKey)
  return [[{
    label: 'Редактировать',
    icon: 'i-lucide-pencil',
    onSelect: () => openEdit(product)
  }, {
    label: 'Дублировать',
    icon: 'i-lucide-copy',
    onSelect: () => duplicateProduct(product.id)
  }, ...(targets.length > 0
    ? [{ label: 'Переместить в', icon: 'i-lucide-folder-input', children: targets }]
    : [])], [{
    label: 'Удалить',
    icon: 'i-lucide-trash-2',
    color: 'error',
    onSelect: () => deleteProduct(product)
  }]]
}

function groupActions(group: Group): DropdownMenuItem[][] {
  return [[{
    label: 'Новый товар в группе',
    icon: 'i-lucide-plus',
    onSelect: () => openCreate(group.id)
  }, {
    label: 'Редактировать группу',
    icon: 'i-lucide-pencil',
    onSelect: () => openEditGroup(group)
  }], [{
    label: 'Удалить группу',
    icon: 'i-lucide-trash-2',
    color: 'error',
    onSelect: () => deleteGroup(group)
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
            @click="openCreate()"
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

      <div
        v-else-if="isEmpty"
        class="text-center py-16"
      >
        <UIcon
          name="i-lucide-package-x"
          class="size-12 text-muted/30 mx-auto"
        />
        <p class="mt-3 text-muted">
          У вас пока нет товаров
        </p>
        <UButton
          label="Создать первый товар"
          icon="i-lucide-plus"
          class="mt-4"
          @click="openCreate()"
        />
      </div>

      <template v-else>
        <div class="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Поиск товаров и групп..."
            class="w-full lg:max-w-xs"
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

          <UTabs
            v-model="view"
            :items="viewItems"
            :content="false"
            size="sm"
            class="lg:ml-auto"
          />
        </div>

        <div
          v-if="sections.length === 0"
          class="text-center py-16"
        >
          <UIcon
            name="i-lucide-search-x"
            class="size-12 text-muted/30 mx-auto"
          />
          <p class="mt-3 text-muted">
            Товары не найдены
          </p>
          <UButton
            label="Сбросить фильтры"
            color="neutral"
            variant="soft"
            class="mt-4"
            @click="resetFilters"
          />
        </div>

        <ProductListView
          v-else-if="view === 'list'"
          :sections="sections"
          :grouped="groups.length > 0"
          :collapsed="collapsed"
          :product-actions="productActions"
          :group-actions="groupActions"
          @open="openEdit"
          @toggle="toggleSection"
          @edit-group="openEditGroup"
          @move="moveProduct"
        />

        <ProductCardsView
          v-else
          :sections="sections"
          :grouped="groups.length > 0"
          :collapsed="collapsed"
          :multi-server-enabled="multiServerEnabled"
          :product-actions="productActions"
          :group-actions="groupActions"
          @open="openEdit"
          @toggle="toggleSection"
          @edit-group="openEditGroup"
          @move="moveProduct"
        />
      </template>
    </template>
  </UDashboardPanel>

  <ProductFormSlideover
    v-model:open="showProductForm"
    :product="editingProduct"
    :servers="servers"
    :multi-server-enabled="multiServerEnabled"
    :groups="groups"
    :default-group-ids="createGroupIds"
    @saved="onProductSaved"
  />

  <GroupFormSlideover
    v-model:open="showGroupForm"
    :group="editingGroup"
    :products="products"
    @saved="onGroupSaved"
  />
</template>
