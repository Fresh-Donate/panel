<script setup lang="ts">
import type { Product } from '~/types'

const props = defineProps<{
  product: Product
}>()

const hasDiscount = computed(() =>
  (props.product.discountPercent ?? 0) > 0
  && props.product.discountedPrice !== undefined
  && props.product.discountedPrice < props.product.price
)
</script>

<template>
  <div class="flex items-baseline gap-1.5 whitespace-nowrap">
    <span class="font-semibold tabular-nums text-highlighted">
      {{ formatMoney(hasDiscount ? product.discountedPrice! : product.price, product.currency) }}
    </span>
    <span
      v-if="hasDiscount"
      class="text-xs text-muted line-through tabular-nums"
    >
      {{ formatMoney(product.price, product.currency) }}
    </span>
  </div>
</template>
