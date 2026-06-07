<script setup lang="ts">
import type { Product, Promotion } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const showCreate = ref(false)
const showEdit = ref(false)
const editing = ref<Promotion | null>(null)

const promotions = ref<Promotion[]>([])
const products = ref<Product[]>([])
const loading = ref(true)

function authHeaders() {
  return { Authorization: `Bearer ${token.value}` }
}

async function fetchAll() {
  loading.value = true
  try {
    // Promotions list needs the products list too - we render product names
    // for each row and feed the slideover's multi-select.
    const [promos, prods] = await Promise.all([
      $fetch<Promotion[]>('/promotions', {
        baseURL: config.public.apiBase as string,
        headers: authHeaders()
      }),
      $fetch<Product[]>('/products', {
        baseURL: config.public.apiBase as string
      })
    ])
    promotions.value = promos
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

function statusOf(promo: Promotion): { label: string, color: 'success' | 'warning' | 'neutral' } {
  const now = Date.now()
  const starts = new Date(promo.startsAt).getTime()
  const ends = new Date(promo.endsAt).getTime()
  if (now < starts) return { label: 'Запланирована', color: 'warning' }
  if (now > ends) return { label: 'Завершена', color: 'neutral' }
  return { label: 'Активна', color: 'success' }
}

function fmt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

const columns: TableColumn<Promotion>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'discountPercent', header: 'Скидка' },
  { accessorKey: 'period', header: 'Период' },
  { accessorKey: 'productIds', header: 'Товары' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'actions', header: '' }
]

async function deletePromotion(id: string) {
  try {
    await $fetch(`/promotions/${id}`, {
      baseURL: config.public.apiBase as string,
      method: 'DELETE',
      headers: authHeaders()
    })
    promotions.value = promotions.value.filter(p => p.id !== id)
    toast.add({ title: 'Акция удалена', icon: 'i-lucide-trash-2', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось удалить акцию.', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

function openEdit(promo: Promotion) {
  editing.value = { ...promo, productIds: [...promo.productIds] }
  showEdit.value = true
}

function onUpdated(updated: Promotion) {
  const idx = promotions.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) promotions.value[idx] = updated
  showEdit.value = false
}

function getActions(promo: Promotion) {
  return [[{
    label: 'Редактировать',
    icon: 'i-lucide-pencil',
    onSelect: () => openEdit(promo)
  }], [{
    label: 'Удалить',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => deletePromotion(promo.id)
  }]]
}
</script>

<template>
  <UDashboardPanel id="promotions">
    <template #header>
      <UDashboardNavbar title="Акции">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Создать акцию"
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
          v-if="promotions.length > 0"
          :data="promotions"
          :columns="columns"
        >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-lg bg-elevated border border-default flex items-center justify-center shrink-0">
                <UIcon
                  name="i-lucide-tag"
                  class="size-5 text-primary"
                />
              </div>
              <p class="font-medium">
                {{ row.original.name }}
              </p>
            </div>
          </template>

          <template #discountPercent-cell="{ row }">
            <span class="font-semibold tabular-nums text-primary">
              −{{ row.original.discountPercent }}%
            </span>
          </template>

          <template #period-cell="{ row }">
            <div class="text-xs text-muted leading-snug">
              <div>{{ fmt(row.original.startsAt) }}</div>
              <div>→ {{ fmt(row.original.endsAt) }}</div>
            </div>
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

          <template #status-cell="{ row }">
            <UBadge
              :label="statusOf(row.original).label"
              :color="statusOf(row.original).color"
              variant="subtle"
              size="sm"
            />
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
            name="i-lucide-tag"
            class="size-12 text-muted/30 mx-auto"
          />
          <p class="mt-3 text-muted">
            У вас пока нет акций
          </p>
          <UButton
            label="Создать первую акцию"
            icon="i-lucide-plus"
            class="mt-4"
            @click="showCreate = true"
          />
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <PromotionCreateSlideover
    v-model:open="showCreate"
    :products="products"
    @created="(p: Promotion) => { promotions.unshift(p); showCreate = false }"
  />

  <PromotionEditSlideover
    v-if="editing"
    v-model:open="showEdit"
    :promotion="editing"
    :products="products"
    @updated="onUpdated"
  />
</template>
