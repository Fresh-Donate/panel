<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { PRODUCT_TYPES } from '~/types'
import type { Group, Product, ProductSection, ProductType } from '~/types'

const props = defineProps<{
  sections: ProductSection[]
  grouped: boolean
  collapsed: Set<string>
  productActions: (product: Product, sectionKey: string) => DropdownMenuItem[][]
  groupActions: (group: Group) => DropdownMenuItem[][]
}>()

const emit = defineEmits<{
  open: [product: Product]
  toggle: [key: string]
  editGroup: [group: Group]
  move: [productId: string, from: string, to: string]
}>()

const { source, target, start, over, leave, drop, end, isDragged } = useProductDrag(
  (productId, from, to) => emit('move', productId, from, to)
)

const visibleSections = computed(() =>
  props.sections.filter(s => s.group || s.products.length > 0 || source.value)
)

function typeOf(type: ProductType) {
  return PRODUCT_TYPES.find(t => t.value === type)
}
</script>

<template>
  <div class="relative overflow-x-auto rounded-lg border border-default">
    <table class="min-w-full">
      <thead class="bg-elevated/50 border-b border-default">
        <tr>
          <th class="px-4 py-3 text-sm text-highlighted text-left font-semibold">
            Товар
          </th>
          <th class="px-4 py-3 text-sm text-highlighted text-left font-semibold hidden sm:table-cell">
            Тип
          </th>
          <th class="px-4 py-3 text-sm text-highlighted text-left font-semibold">
            Цена
          </th>
          <th class="px-4 py-3 text-sm text-highlighted text-left font-semibold hidden md:table-cell">
            Кол-во
          </th>
          <th class="w-px" />
        </tr>
      </thead>

      <tbody
        v-for="section in visibleSections"
        :key="section.key"
        class="divide-y divide-default transition-colors [&:not(:last-child)]:border-b [&:not(:last-child)]:border-default"
        :class="{ 'bg-primary/5': target === section.key }"
        @dragover="over($event, section.key)"
        @dragleave="leave($event, section.key)"
        @drop="drop($event, section.key)"
      >
        <tr
          v-if="grouped"
          :class="target === section.key ? 'bg-primary/10' : 'bg-elevated/25'"
        >
          <td
            colspan="5"
            class="px-2 py-1.5"
          >
            <GroupSectionHeader
              :group="section.group"
              :count="section.products.length"
              :collapsed="collapsed.has(section.key)"
              :actions="section.group ? groupActions(section.group) : undefined"
              @toggle="emit('toggle', section.key)"
            />
          </td>
        </tr>

        <template v-if="!collapsed.has(section.key)">
          <tr
            v-for="product in section.products"
            :key="product.id"
            :draggable="grouped"
            class="group/row cursor-pointer hover:bg-elevated/50 transition-colors"
            :class="{ 'opacity-40': isDragged(product.id, section.key) }"
            @click="emit('open', product)"
            @dragstart="start($event, product.id, section.key)"
            @dragend="end"
          >
            <td class="px-4 py-3 text-sm">
              <div class="flex items-center gap-3 min-w-0">
                <UIcon
                  v-if="grouped"
                  name="i-lucide-grip-vertical"
                  class="size-4 -ml-2 -mr-1 shrink-0 text-dimmed cursor-grab opacity-0 group-hover/row:opacity-100 transition-opacity"
                />
                <ProductThumb
                  :product="product"
                  class="size-10"
                />
                <div class="min-w-0">
                  <p class="font-medium text-highlighted truncate max-w-xs">
                    {{ product.name }}
                  </p>
                  <p
                    v-if="product.description"
                    class="text-muted truncate max-w-xs"
                  >
                    {{ product.description }}
                  </p>
                </div>
              </div>
            </td>

            <td class="px-4 py-3 text-sm hidden sm:table-cell">
              <UBadge
                :label="typeOf(product.type)?.label ?? product.type"
                variant="subtle"
                size="sm"
              />
            </td>

            <td class="px-4 py-3 text-sm">
              <ProductPrice :product="product" />
            </td>

            <td class="px-4 py-3 text-sm text-muted tabular-nums whitespace-nowrap hidden md:table-cell">
              <template v-if="product.type === 'privilege'">
                -
              </template>
              <template v-else>
                × {{ formatNumber(product.quantity) }}
              </template>
            </td>

            <td
              class="px-4 py-3 text-right"
              @click.stop
            >
              <UDropdownMenu :items="productActions(product, section.key)">
                <UButton
                  icon="i-lucide-ellipsis"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  square
                  aria-label="Действия с товаром"
                />
              </UDropdownMenu>
            </td>
          </tr>

          <tr v-if="section.products.length === 0">
            <td
              colspan="5"
              class="px-4 py-3 text-sm text-muted"
            >
              <div
                v-if="section.group"
                class="flex items-center gap-3"
              >
                В группе нет товаров
                <UButton
                  label="Добавить"
                  icon="i-lucide-plus"
                  size="xs"
                  variant="soft"
                  @click="emit('editGroup', section.group)"
                />
              </div>
              <template v-else>
                Перетащите сюда, чтобы убрать товар из групп
              </template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
