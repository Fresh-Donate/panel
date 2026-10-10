<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { PRODUCT_TYPES } from '~/types'
import type { Product, ProductType } from '~/types'

const props = defineProps<{
  product: Product
  actions: DropdownMenuItem[][]
  multiServerEnabled?: boolean
  movable?: boolean
}>()

const emit = defineEmits<{
  open: [product: Product]
}>()

const quantityLabels: Record<ProductType, string> = {
  item: 'Количество',
  privilege: 'Количество',
  currency: 'Сумма',
  other: 'Количество'
}

const type = computed(() => PRODUCT_TYPES.find(t => t.value === props.product.type))
const promotions = computed(() => props.product.activePromotions ?? [])
const servers = computed(() => props.product.servers ?? [])
const hasQuantity = computed(() => props.product.type !== 'privilege')
const hasDetails = computed(() => hasQuantity.value || props.multiServerEnabled || promotions.value.length > 0)
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :draggable="movable"
    class="group/card flex flex-col rounded-lg border border-default bg-default p-4 gap-4 text-sm cursor-pointer transition-colors hover:border-accented hover:bg-elevated/25 focus-visible:outline-2 focus-visible:outline-primary"
    @click="emit('open', product)"
    @keydown.enter.self="emit('open', product)"
    @keydown.space.self.prevent="emit('open', product)"
  >
    <div class="flex items-start gap-3">
      <ProductThumb
        :product="product"
        class="size-14"
      />
      <div class="flex-1 min-w-0 space-y-1.5">
        <p class="font-semibold text-highlighted truncate">
          {{ product.name }}
        </p>
        <div class="flex flex-wrap items-center gap-1.5">
          <UBadge
            :label="type?.label ?? product.type"
            :icon="type?.icon"
            variant="subtle"
            size="sm"
          />
          <UBadge
            v-if="(product.discountPercent ?? 0) > 0"
            :label="`-${product.discountPercent}%`"
            color="success"
            variant="subtle"
            size="sm"
          />
        </div>
      </div>
      <div
        class="flex items-center -mt-1 -mr-1"
        @click.stop
      >
        <UTooltip
          v-if="movable"
          text="Перетащите в другую группу"
        >
          <UIcon
            name="i-lucide-grip-vertical"
            class="size-4 text-dimmed cursor-grab opacity-0 group-hover/card:opacity-100 transition-opacity"
          />
        </UTooltip>
        <UDropdownMenu :items="actions">
          <UButton
            icon="i-lucide-ellipsis"
            variant="ghost"
            color="neutral"
            size="sm"
            square
            aria-label="Действия с товаром"
          />
        </UDropdownMenu>
      </div>
    </div>

    <p
      v-if="product.description"
      class="text-muted line-clamp-2 -mt-1"
    >
      {{ product.description }}
    </p>

    <ProductPrice
      :product="product"
      class="text-lg"
    />

    <dl
      v-if="hasDetails"
      class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-default pt-3"
    >
      <template v-if="hasQuantity">
        <dt class="text-muted">
          {{ quantityLabels[product.type] }}
        </dt>
        <dd class="text-right tabular-nums">
          {{ formatNumber(product.quantity) }}
          <span
            v-if="product.allowCustomCount"
            class="text-muted"
          >· на выбор</span>
        </dd>
      </template>

      <template v-if="multiServerEnabled">
        <dt class="text-muted">
          Сервера
        </dt>
        <dd
          v-if="servers.length > 0"
          class="text-right truncate"
          :title="servers.map(s => s.name).join(', ')"
        >
          {{ servers.map(s => s.name).join(', ') }}
        </dd>
        <dd
          v-else
          class="text-right text-warning"
        >
          Нет, скрыт на витрине
        </dd>
      </template>

      <template v-if="promotions.length > 0">
        <dt class="text-muted">
          Акции
        </dt>
        <dd class="flex flex-wrap justify-end gap-1">
          <UBadge
            v-for="promo in promotions"
            :key="promo.id"
            :label="`${promo.name} -${promo.discountPercent}%`"
            color="success"
            variant="subtle"
            size="sm"
          />
        </dd>
      </template>
    </dl>
  </div>
</template>
