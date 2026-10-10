<script setup lang="ts">
import { z } from 'zod'
import type { Product, Group } from '~/types'

const props = defineProps<{
  group?: Group | null
  products: Product[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  saved: [group: Group]
}>()

const api = useApi()
const notify = useNotify()
const loading = ref(false)

const isEdit = computed(() => !!props.group)

function close() {
  open.value = false
}

const schema = z.object({
  name: z.string().min(1, 'Название обязательно').max(128, 'Макс. 128 символов'),
  upgradeMode: z.boolean(),
  productIds: z.array(z.string())
})

type FormState = z.input<typeof schema>

function stateFrom(g?: Group | null): FormState {
  return {
    name: g?.name ?? '',
    upgradeMode: g?.upgradeMode ?? false,
    productIds: [...(g?.productIds ?? [])]
  }
}

const state = reactive<FormState>(stateFrom())

watch(open, (val) => {
  if (val) Object.assign(state, stateFrom(props.group))
}, { immediate: true })

const productItems = computed(() =>
  props.products.map(p => ({ label: p.name, value: p.id }))
)

async function onSubmit() {
  loading.value = true
  try {
    const body = { ...state }
    const saved = props.group
      ? await api<Group>(`/groups/${props.group.id}`, { method: 'PUT', body })
      : await api<Group>('/groups', { method: 'POST', body })

    emit('saved', saved)
    notify.success(isEdit.value ? 'Группа обновлена' : 'Группа создана')
  } catch (err) {
    notify.apiError(err, isEdit.value ? 'Не удалось обновить группу.' : 'Не удалось создать группу.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? 'Редактирование группы' : 'Новая группа'"
    :description="isEdit ? undefined : 'Товары одной линейки, например ранги.'"
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
            placeholder="Привилегии, Кейсы..."
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Режим доплаты"
          name="upgradeMode"
          description="Повторная или более дешёвая покупка блокируется, более дорогая идёт со скидкой на стоимость последнего купленного товара группы."
        >
          <USwitch
            v-model="state.upgradeMode"
            class="w-full max-w-xs"
          />
        </UFormField>

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
            :label="isEdit ? 'Сохранить' : 'Создать группу'"
            :icon="isEdit ? 'i-lucide-save' : 'i-lucide-layers'"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
