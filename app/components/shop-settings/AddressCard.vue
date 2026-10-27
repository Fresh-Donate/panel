<script setup lang="ts">
import { z } from 'zod'
import type { ShopSettings } from '~/types'

const props = defineProps<{
  shopUrl: string
}>()

const emit = defineEmits<{
  saved: [shopUrl: string]
}>()

const api = useApi()
const notify = useNotify()

const schema = z.object({
  shopUrl: z.union([z.literal(''), z.string().url('Должен быть валидный URL').max(256, 'Максимум 256 символов')])
})

const state = reactive({ shopUrl: props.shopUrl })
const saving = ref(false)

watch(() => props.shopUrl, (value) => {
  state.shopUrl = value
})

async function onSubmit() {
  saving.value = true
  try {
    const data = await api<ShopSettings>('/shop-settings', {
      method: 'PUT',
      body: { shopUrl: state.shopUrl }
    })
    state.shopUrl = data.shopUrl
    emit('saved', data.shopUrl)
    notify.success('Адрес магазина сохранён')
  } catch (err) {
    notify.apiError(err, 'Не удалось сохранить адрес магазина.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UPageCard>
    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Адрес магазина"
        name="shopUrl"
        description="Отсюда панель получает список настроек магазина. Ещё нужен для canonical-ссылок, Open Graph и sitemap.xml. Без слэша в конце."
      >
        <UInput
          v-model="state.shopUrl"
          placeholder="https://shop.example.com"
          icon="i-lucide-globe"
          class="w-full max-w-lg"
        />
      </UFormField>

      <UButton
        type="submit"
        label="Сохранить"
        icon="i-lucide-save"
        :loading="saving"
      />
    </UForm>
  </UPageCard>
</template>
