<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Group, Product, ProductSection } from '~/types'

const props = defineProps<{
  sections: ProductSection[]
  grouped: boolean
  collapsed: Set<string>
  multiServerEnabled?: boolean
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
</script>

<template>
  <div class="space-y-6">
    <section
      v-for="section in visibleSections"
      :key="section.key"
      class="rounded-lg outline-2 outline-dashed outline-offset-4 transition-colors"
      :class="target === section.key ? 'outline-primary/60 bg-primary/5' : 'outline-transparent'"
      @dragover="over($event, section.key)"
      @dragleave="leave($event, section.key)"
      @drop="drop($event, section.key)"
    >
      <GroupSectionHeader
        v-if="grouped"
        :group="section.group"
        :count="section.products.length"
        :collapsed="collapsed.has(section.key)"
        :actions="section.group ? groupActions(section.group) : undefined"
        class="-ml-2 mb-3"
        @toggle="emit('toggle', section.key)"
      />

      <template v-if="!collapsed.has(section.key)">
        <div
          v-if="section.products.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
        >
          <ProductCard
            v-for="product in section.products"
            :key="product.id"
            :product="product"
            :actions="productActions(product, section.key)"
            :multi-server-enabled="multiServerEnabled"
            :movable="grouped"
            :class="{ 'opacity-40': isDragged(product.id, section.key) }"
            @open="emit('open', $event)"
            @dragstart="start($event, product.id, section.key)"
            @dragend="end"
          />
        </div>

        <div
          v-else-if="section.group"
          class="flex items-center gap-3 rounded-lg border border-dashed border-default px-4 py-3 text-sm text-muted"
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

        <div
          v-else
          class="rounded-lg border border-dashed border-default px-4 py-3 text-sm text-muted"
        >
          Перетащите сюда, чтобы убрать товар из групп
        </div>
      </template>
    </section>
  </div>
</template>
