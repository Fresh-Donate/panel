<script setup lang="ts">
import type { Product, Group } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const showCreate = ref(false)
const showEdit = ref(false)
const editing = ref<Group | null>(null)

const groups = ref<Group[]>([])
const products = ref<Product[]>([])
const loading = ref(true)

function authHeaders() {
  return { Authorization: `Bearer ${token.value}` }
}

async function fetchAll() {
  loading.value = true
  try {
    const [groupsList, prods] = await Promise.all([
      $fetch<Group[]>('/groups', {
        baseURL: config.public.apiBase as string,
        headers: authHeaders()
      }),
      $fetch<Product[]>('/products', {
        baseURL: config.public.apiBase as string
      })
    ])
    groups.value = groupsList
    products.value = prods
  } catch {
    toast.add({ title: 'Ошибка загрузки', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

const productNameById = computed(() => {
  const map = new Map<string, string>()
  for (const p of products.value) map.set(p.id, p.name)
  return map
})

const columns: TableColumn<Group>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'upgradeMode', header: 'Режим' },
  { accessorKey: 'productIds', header: 'Товары' },
  { accessorKey: 'actions', header: '' }
]

async function deleteGroup(id: string) {
  try {
    await $fetch(`/groups/${id}`, {
      baseURL: config.public.apiBase as string,
      method: 'DELETE',
      headers: authHeaders()
    })
    groups.value = groups.value.filter(g => g.id !== id)
    toast.add({ title: 'Группа удалена', icon: 'i-lucide-trash-2', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось удалить группу.', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

function openEdit(group: Group) {
  editing.value = { ...group, productIds: [...group.productIds] }
  showEdit.value = true
}

function onUpdated(updated: Group) {
  const idx = groups.value.findIndex(g => g.id === updated.id)
  if (idx !== -1) groups.value[idx] = updated
  showEdit.value = false
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
    onSelect: () => deleteGroup(group.id)
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
            @click="showCreate = true"
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
            @click="showCreate = true"
          />
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <GroupCreateSlideover
    v-model:open="showCreate"
    :products="products"
    @created="(g: Group) => { groups.unshift(g); showCreate = false }"
  />

  <GroupEditSlideover
    v-if="editing"
    v-model:open="showEdit"
    :group="editing"
    :products="products"
    @updated="onUpdated"
  />
</template>
