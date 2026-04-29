<script setup lang="ts">
import { z } from 'zod'
import type { Product, Promotion } from '~/types'
import { isoToLocalInputValue, localInputToIso } from '~/utils/datetime'

const props = defineProps<{
  promotion: Promotion
  products: Product[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  updated: [promotion: Promotion]
}>()

const config = useRuntimeConfig()
const token = useCookie('auth_token')
const toast = useToast()
const loading = ref(false)

const schema = z.object({
  name: z.string().min(1, 'Название обязательно').max(128, 'Макс. 128 символов'),
  discountPercent: z.number().int().min(1, 'Минимум 1%').max(100, 'Максимум 100%'),
  startsAt: z.string().min(1, 'Укажите дату начала'),
  endsAt: z.string().min(1, 'Укажите дату окончания'),
  productIds: z.array(z.string())
}).refine(d => new Date(d.endsAt) > new Date(d.startsAt), {
  message: 'Окончание должно быть позже начала',
  path: ['endsAt']
})

type FormState = z.input<typeof schema>

const state = reactive<FormState>({
  name: '',
  discountPercent: 10,
  startsAt: '',
  endsAt: '',
  productIds: []
})

watch(() => props.promotion, (p) => {
  if (p) {
    state.name = p.name
    state.discountPercent = p.discountPercent
    state.startsAt = isoToLocalInputValue(p.startsAt)
    state.endsAt = isoToLocalInputValue(p.endsAt)
    state.productIds = [...p.productIds]
  }
}, { immediate: true })

const productItems = computed(() =>
  props.products.map(p => ({ label: p.name, value: p.id }))
)

async function onSubmit() {
  loading.value = true
  try {
    const updated = await $fetch<Promotion>(`/promotions/${props.promotion.id}`, {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        name: state.name,
        discountPercent: state.discountPercent,
        startsAt: localInputToIso(state.startsAt),
        endsAt: localInputToIso(state.endsAt),
        productIds: state.productIds
      }
    })

    emit('updated', updated)
    toast.add({
      title: 'Акция обновлена',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось обновить акцию.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Редактирование акции"
    description="Изменения вступают в силу сразу — обновлённая цена появится в магазине."
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          label="Название"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Размер скидки (%)"
          name="discountPercent"
          required
          description="Если на товаре несколько акций, проценты складываются (максимум 100%)."
        >
          <UInput
            v-model.number="state.discountPercent"
            type="number"
            :min="1"
            :max="100"
            class="w-full max-w-xs"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UFormField
            label="Начало"
            name="startsAt"
            required
          >
            <UInput
              v-model="state.startsAt"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Окончание"
            name="endsAt"
            required
          >
            <UInput
              v-model="state.endsAt"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Товары"
          name="productIds"
        >
          <USelectMenu
            v-model="state.productIds"
            :items="productItems"
            value-key="value"
            multiple
            searchable
            placeholder="Выберите товары..."
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-3 pt-2">
          <UButton
            label="Отмена"
            variant="ghost"
            color="neutral"
            @click="open = false"
          />
          <UButton
            type="submit"
            label="Сохранить"
            icon="i-lucide-save"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
