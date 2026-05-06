<script setup lang="ts">
import { z } from 'zod'
import type { Product, Promotion } from '~/types'
import { toLocalInputValue, localInputToIso } from '~/utils/datetime'

const props = defineProps<{
  products: Product[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  created: [promotion: Promotion]
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

function buildInitial(): FormState {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return {
    name: '',
    discountPercent: 10,
    startsAt: toLocalInputValue(now),
    endsAt: toLocalInputValue(tomorrow),
    productIds: []
  }
}

const state = reactive<FormState>(buildInitial())

function reset() {
  Object.assign(state, buildInitial())
}

watch(open, (val) => {
  if (val) reset()
})

const productItems = computed(() =>
  props.products.map(p => ({ label: p.name, value: p.id }))
)

async function onSubmit() {
  loading.value = true
  try {
    const promotion = await $fetch<Promotion>('/promotions', {
      baseURL: config.public.apiBase as string,
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        name: state.name,
        discountPercent: state.discountPercent,
        startsAt: localInputToIso(state.startsAt),
        endsAt: localInputToIso(state.endsAt),
        productIds: state.productIds
      }
    })

    emit('created', promotion)
    toast.add({
      title: 'Акция создана',
      description: `«${promotion.name}» добавлена.`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось создать акцию.',
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
    title="Новая акция"
    description="Скидка действует на выбранные товары в указанный период."
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
            placeholder="Чёрная пятница, Запуск сервера..."
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
          description="Оставьте пустым, чтобы создать акцию без товаров (можно добавить позже)."
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
            label="Создать акцию"
            icon="i-lucide-tag"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
