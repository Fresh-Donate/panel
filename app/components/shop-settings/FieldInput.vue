<script setup lang="ts">
import type { ShopField, ShopFieldItem, ShopFieldValue } from '~/types'

const props = defineProps<{
  field: ShopField
  name: string
}>()

const model = defineModel<ShopFieldValue | undefined>()

const text = computed({
  get: () => (typeof model.value === 'string' ? model.value : ''),
  set: (value: string) => {
    model.value = value
  }
})

const number = computed({
  get: () => (typeof model.value === 'number' ? model.value : null),
  set: (value: number | null | undefined) => {
    model.value = typeof value === 'number' && Number.isFinite(value) ? value : null
  }
})

const toggle = computed({
  get: () => model.value === true,
  set: (value: boolean) => {
    model.value = value
  }
})

const selected = computed({
  get: () => (Array.isArray(model.value) ? model.value.filter((v): v is string => typeof v === 'string') : []),
  set: (value: string[]) => {
    model.value = value
  }
})

const items = computed({
  get: () => (Array.isArray(model.value) ? (model.value as ShopFieldItem[]) : []),
  set: (value: ShopFieldItem[]) => {
    model.value = value
  }
})

const localDateTime = computed({
  get: () => (text.value ? isoToLocalInputValue(text.value) : ''),
  set: (value: string) => {
    model.value = localInputToIso(value)
  }
})

const options = computed(() => props.field.options ?? [])

const inputType = computed(() => {
  switch (props.field.type) {
    case 'email': return 'email'
    case 'url': return 'url'
    case 'date': return 'date'
    default: return 'text'
  }
})

const timeZone = timeZoneLabel()
</script>

<template>
  <UFormField
    :label="field.label"
    :name="name"
    :description="field.description"
    :required="field.required"
  >
    <ShopSettingsListInput
      v-if="field.type === 'list'"
      v-model="items"
      :field="field"
      :name="name"
    />

    <UTextarea
      v-else-if="field.type === 'textarea'"
      v-model="text"
      :rows="field.rows ?? 3"
      :placeholder="field.placeholder"
      :maxlength="field.max"
      autoresize
      class="w-full max-w-lg"
    />

    <UInputNumber
      v-else-if="field.type === 'number'"
      v-model="number"
      :min="field.min"
      :max="field.max"
      :step="field.step ?? 1"
      :placeholder="field.placeholder"
      class="w-full max-w-xs"
    />

    <USwitch
      v-else-if="field.type === 'boolean'"
      v-model="toggle"
    />

    <USelectMenu
      v-else-if="field.type === 'select' && field.multiple"
      v-model="selected"
      :items="options"
      value-key="value"
      multiple
      :placeholder="field.placeholder"
      class="w-full max-w-md"
    />

    <USelectMenu
      v-else-if="field.type === 'select'"
      v-model="text"
      :items="options"
      value-key="value"
      class="w-full max-w-md"
    />

    <ShopSettingsColorInput
      v-else-if="field.type === 'color'"
      v-model="text"
      :format="field.format"
    />

    <UploadImageInput
      v-else-if="field.type === 'image'"
      v-model:url="text"
      endpoint="/uploads/shop-image"
      class="max-w-lg"
    />

    <UploadFileInput
      v-else-if="field.type === 'file'"
      v-model:url="text"
      :accept="field.accept"
      class="max-w-lg"
    />

    <UInput
      v-else-if="field.type === 'datetime'"
      v-model="localDateTime"
      type="datetime-local"
      class="w-full max-w-xs"
    >
      <template #trailing>
        <span class="text-xs text-muted">{{ timeZone }}</span>
      </template>
    </UInput>

    <UInput
      v-else
      v-model="text"
      :type="inputType"
      :placeholder="field.placeholder"
      :icon="field.icon"
      :maxlength="field.max"
      class="w-full max-w-lg"
    />
  </UFormField>
</template>
