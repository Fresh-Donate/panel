<script setup lang="ts">
import { z } from 'zod'
import type { Product, Promotion } from '~/types'

const props = defineProps<{
  promotion?: Promotion | null
  products: Product[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  saved: [promotion: Promotion]
}>()

const api = useApi()
const notify = useNotify()
const loading = ref(false)

const isEdit = computed(() => !!props.promotion)

function close() {
  open.value = false
}

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

function stateFrom(p?: Promotion | null): FormState {
  if (p) {
    return {
      name: p.name,
      discountPercent: p.discountPercent,
      startsAt: isoToLocalInputValue(p.startsAt),
      endsAt: isoToLocalInputValue(p.endsAt),
      productIds: [...p.productIds]
    }
  }
  const now = new Date()
  return {
    name: '',
    discountPercent: 10,
    startsAt: toLocalInputValue(now),
    endsAt: toLocalInputValue(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    productIds: []
  }
}

const state = reactive<FormState>(stateFrom())

watch(open, (val) => {
  if (val) Object.assign(state, stateFrom(props.promotion))
}, { immediate: true })

const productItems = computed(() =>
  props.products.map(p => ({ label: p.name, value: p.id }))
)

async function onSubmit() {
  loading.value = true
  try {
    const body = {
      name: state.name,
      discountPercent: state.discountPercent,
      startsAt: localInputToIso(state.startsAt),
      endsAt: localInputToIso(state.endsAt),
      productIds: state.productIds
    }
    const saved = props.promotion
      ? await api<Promotion>(`/promotions/${props.promotion.id}`, { method: 'PUT', body })
      : await api<Promotion>('/promotions', { method: 'POST', body })

    emit('saved', saved)
    notify.success(isEdit.value ? 'Акция обновлена' : 'Акция создана')
  } catch (err) {
    notify.apiError(err, isEdit.value ? 'Не удалось обновить акцию.' : 'Не удалось создать акцию.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? 'Редактирование акции' : 'Новая акция'"
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
            @click="close"
          />
          <UButton
            type="submit"
            :label="isEdit ? 'Сохранить' : 'Создать акцию'"
            :icon="isEdit ? 'i-lucide-save' : 'i-lucide-tag'"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
