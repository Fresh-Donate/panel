<script setup lang="ts">
import type { ShopFieldGroup, ShopFieldItem, ShopSettings, ShopSettingsSchema } from '~/types'

const props = defineProps<{
  schema: ShopSettingsSchema
  values: ShopFieldItem
}>()

const emit = defineEmits<{
  saved: [settings: ShopSettings]
}>()

const api = useApi()
const notify = useNotify()

const fields = computed(() => props.schema.groups.flatMap(g => g.fields).filter(f => SHOP_FIELD_TYPES.includes(f.type)))
const state = ref<ShopFieldItem>({})
const saving = ref(false)

function reset() {
  state.value = resolveShopFields(fields.value, props.values)
}

watch(() => [props.schema, props.values], reset, { immediate: true })

function visibleFields(group: ShopFieldGroup) {
  return group.fields.filter(f => SHOP_FIELD_TYPES.includes(f.type) && isShopFieldVisible(f, state.value, fields.value))
}

function validate() {
  return validateShopFields(fields.value, state.value)
}

async function onSubmit() {
  saving.value = true
  try {
    const data = await api<ShopSettings>('/shop-settings', {
      method: 'PUT',
      body: { fields: state.value, schema: props.schema }
    })
    emit('saved', data)
    notify.success('Настройки сохранены')
  } catch (err) {
    notify.apiError(err, 'Не удалось сохранить настройки.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    class="space-y-6"
    @submit="onSubmit"
  >
    <UPageCard
      v-for="group in schema.groups"
      :key="group.id"
      :title="group.label"
      :description="group.description"
      :icon="group.icon"
    >
      <div class="space-y-6">
        <template
          v-for="(field, index) in visibleFields(group)"
          :key="field.key"
        >
          <USeparator v-if="index > 0" />
          <ShopSettingsFieldInput
            v-model="state[field.key]"
            :field="field"
            :name="field.key"
          />
        </template>
      </div>
    </UPageCard>

    <div>
      <UButton
        type="submit"
        label="Сохранить"
        icon="i-lucide-save"
        :loading="saving"
      />
    </div>
  </UForm>
</template>
