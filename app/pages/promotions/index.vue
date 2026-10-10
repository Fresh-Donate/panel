<script setup lang="ts">
import type { Promotion } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const productsStore = useProductsStore()
const { items: products, nameById: productNameById } = storeToRefs(productsStore)

const showForm = ref(false)
const editing = ref<Promotion | null>(null)

const promotions = ref<Promotion[]>([])
const loading = ref(true)

async function fetchAll() {
  loading.value = true
  try {
    const [promos] = await Promise.all([
      api<Promotion[]>('/promotions'),
      productsStore.load()
    ])
    promotions.value = promos
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить акции.', 'Ошибка загрузки')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

function statusOf(promo: Promotion): { label: string, color: 'success' | 'warning' | 'neutral' } {
  const now = Date.now()
  if (now < new Date(promo.startsAt).getTime()) return { label: 'Запланирована', color: 'warning' }
  if (now > new Date(promo.endsAt).getTime()) return { label: 'Завершена', color: 'neutral' }
  return { label: 'Активна', color: 'success' }
}

const columns: TableColumn<Promotion>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'discountPercent', header: 'Скидка' },
  { accessorKey: 'period', header: 'Период' },
  { accessorKey: 'productIds', header: 'Товары' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'actions', header: '' }
]

async function deletePromotion(promo: Promotion) {
  const confirmed = await confirm({
    title: `Удалить акцию «${promo.name}»?`,
    description: 'Скидка сразу перестанет действовать в магазине.',
    confirmLabel: 'Удалить'
  })
  if (!confirmed) return
  try {
    await api(`/promotions/${promo.id}`, { method: 'DELETE' })
    promotions.value = promotions.value.filter(p => p.id !== promo.id)
    notify.success('Акция удалена', undefined, 'i-lucide-trash-2')
  } catch (err) {
    notify.apiError(err, 'Не удалось удалить акцию.')
  }
}

function openCreate() {
  editing.value = null
  showForm.value = true
}

function openEdit(promo: Promotion) {
  editing.value = promo
  showForm.value = true
}

function onSaved(saved: Promotion) {
  const idx = promotions.value.findIndex(p => p.id === saved.id)
  if (idx === -1) promotions.value.unshift(saved)
  else promotions.value[idx] = saved
  showForm.value = false
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
    onSelect: () => deletePromotion(promo)
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
              <div>{{ formatDateTime(row.original.startsAt) }}</div>
              <div>→ {{ formatDateTime(row.original.endsAt) }}</div>
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
            @click="openCreate"
          />
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <PromotionFormSlideover
    v-model:open="showForm"
    :promotion="editing"
    :products="products"
    @saved="onSaved"
  />
</template>
