<script setup lang="ts">
import type { ShopField, ShopFieldItem, ShopFieldValue } from '~/types'

const props = defineProps<{
  field: ShopField
  name: string
}>()

const items = defineModel<ShopFieldItem[]>({ required: true })

const itemFields = computed(() => (props.field.fields ?? []).filter(f => SHOP_FIELD_TYPES.includes(f.type)))
const canAdd = computed(() => props.field.max === undefined || items.value.length < props.field.max)

function itemTitle(item: ShopFieldItem, index: number): string {
  const value = props.field.titleKey ? item[props.field.titleKey] : undefined
  return typeof value === 'string' && value.trim() ? value : `#${index + 1}`
}

function add() {
  items.value = [...items.value, resolveShopFields(itemFields.value, {})]
}

function remove(index: number) {
  items.value = items.value.filter((_, i) => i !== index)
}

function move(index: number, delta: number) {
  const next = [...items.value]
  const [item] = next.splice(index, 1)
  if (!item) return
  next.splice(index + delta, 0, item)
  items.value = next
}

function update(index: number, key: string, value: ShopFieldValue | undefined) {
  items.value = items.value.map((item, i) => (i === index ? { ...item, [key]: value ?? null } : item))
}
</script>

<template>
  <div class="space-y-3 w-full max-w-2xl">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="rounded-lg border border-default p-4 space-y-4"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="font-medium truncate">{{ itemTitle(item, index) }}</span>
        <div class="flex gap-1 shrink-0">
          <UButton
            icon="i-lucide-arrow-up"
            size="xs"
            variant="ghost"
            color="neutral"
            :disabled="index === 0"
            @click="move(index, -1)"
          />
          <UButton
            icon="i-lucide-arrow-down"
            size="xs"
            variant="ghost"
            color="neutral"
            :disabled="index === items.length - 1"
            @click="move(index, 1)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            @click="remove(index)"
          />
        </div>
      </div>

      <template
        v-for="sub in itemFields"
        :key="sub.key"
      >
        <ShopSettingsFieldInput
          v-if="isShopFieldVisible(sub, item, itemFields)"
          :model-value="item[sub.key]"
          :field="sub"
          :name="`${name}.${index}.${sub.key}`"
          @update:model-value="update(index, sub.key, $event)"
        />
      </template>
    </div>

    <UButton
      v-if="canAdd"
      :label="field.addLabel ?? 'Добавить'"
      icon="i-lucide-plus"
      size="sm"
      variant="soft"
      @click="add"
    />
  </div>
</template>
