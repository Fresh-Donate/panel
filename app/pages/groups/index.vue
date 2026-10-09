<script setup lang="ts">
import type { Group } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const productsStore = useProductsStore()
const { items: products, nameById: productNameById } = storeToRefs(productsStore)

const showForm = ref(false)
const editing = ref<Group | null>(null)

const groups = ref<Group[]>([])
const loading = ref(true)

async function fetchAll() {
  loading.value = true
  try {
    const [groupsList] = await Promise.all([
      api<Group[]>('/groups'),
      productsStore.load()
    ])
    groups.value = groupsList
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить группы.', 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

const columns: TableColumn<Group>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'upgradeMode', header: 'Режим' },
  { accessorKey: 'productIds', header: 'Товары' },
  { accessorKey: 'actions', header: '' }
]

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
    notify.success('Группа удалена', undefined, 'i-lucide-trash-2')
  } catch (err) {
    notify.apiError(err, 'Не удалось удалить группу.')
  }
}

function openCreate() {
  editing.value = null
  showForm.value = true
}

function openEdit(group: Group) {
  editing.value = group
  showForm.value = true
}

function onSaved(saved: Group) {
  const idx = groups.value.findIndex(g => g.id === saved.id)
  if (idx === -1) groups.value.unshift(saved)
  else groups.value[idx] = saved
  showForm.value = false
}

function getActions(group: Group) {
  return [[{
    label: 'Редактировать',
    icon: 'i-lucide-pencil',
    onSelect: () => openEdit(group)
  }], [{
    label: 'Удалить',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => deleteGroup(group)
  }]]
}
</script>

<template>
  <UDashboardPanel id="groups">
    <template #header>
      <UDashboardNavbar title="Группы">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Создать группу"
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
        <UTable
          v-if="groups.length > 0"
          :data="groups"
          :columns="columns"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-lg bg-elevated border border-default flex items-center justify-center shrink-0">
                <UIcon
                  name="i-lucide-layers"
                  class="size-5 text-primary"
                />
              </div>
              <p class="font-medium">
                {{ row.original.name }}
              </p>
            </div>
          </template>

          <template #upgradeMode-cell="{ row }">
            <UBadge
              v-if="row.original.upgradeMode"
              label="Доплата"
              icon="i-lucide-arrow-up-right"
              color="primary"
              variant="subtle"
              size="sm"
            />
            <span
              v-else
              class="text-xs text-muted"
            >Обычный</span>
          </template>

          <template #productIds-cell="{ row }">
            <div
              v-if="row.original.productIds.length === 0"
              class="text-xs text-muted italic"
            >
              нет товаров
            </div>
            <div
              v-else
              class="flex flex-wrap gap-1 max-w-md"
            >
              <UBadge
                v-for="pid in row.original.productIds.slice(0, 3)"
                :key="pid"
                :label="productNameById.get(pid) || pid"
                variant="subtle"
                size="sm"
              />
              <UBadge
                v-if="row.original.productIds.length > 3"
                :label="`+${row.original.productIds.length - 3}`"
                variant="soft"
                color="neutral"
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
          v-else
          class="text-center py-16"
        >
          <UIcon
            name="i-lucide-layers"
            class="size-12 text-muted/30 mx-auto"
          />
          <p class="mt-3 text-muted">
            У вас пока нет групп
          </p>
          <UButton
            label="Создать первую группу"
            icon="i-lucide-plus"
            class="mt-4"
            @click="openCreate"
          />
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <GroupFormSlideover
    v-model:open="showForm"
    :group="editing"
    :products="products"
    @saved="onSaved"
  />
</template>
