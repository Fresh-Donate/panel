<script setup lang="ts">
import { PRODUCT_TYPES } from '~/types'
import type { Product } from '~/types'

const props = defineProps<{
  product: Product
}>()

const failed = ref(false)
watch(() => props.product.imageUrl, () => {
  failed.value = false
})

const icon = computed(() => PRODUCT_TYPES.find(t => t.value === props.product.type)?.icon ?? 'i-lucide-package')
</script>

<template>
  <div class="rounded-lg bg-elevated border border-default flex items-center justify-center overflow-hidden shrink-0">
    <img
      v-if="product.imageUrl && !failed"
      :src="product.imageUrl"
      alt=""
      loading="lazy"
      decoding="async"
      class="size-full object-cover"
      @error="failed = true"
    >
    <UIcon
      v-else
      :name="icon"
      class="size-1/2 text-primary"
    />
  </div>
</template>
