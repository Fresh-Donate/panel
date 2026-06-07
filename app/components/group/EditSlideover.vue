<script setup lang="ts">
import { z } from 'zod'
import type { Product, Group } from '~/types'

const props = defineProps<{
  group: Group
  products: Product[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  updated: [group: Group]
}>()

const config = useRuntimeConfig()
const token = useCookie('auth_token')
const toast = useToast()
const loading = ref(false)

const schema = z.object({
  name: z.string().min(1, 'Название обязательно').max(128, 'Макс. 128 символов'),
  upgradeMode: z.boolean(),
  productIds: z.array(z.string())
})

type FormState = z.input<typeof schema>

const state = reactive<FormState>({
  name: '',
  upgradeMode: false,
  productIds: []
})

watch(() => props.group, (g) => {
  if (g) {
    state.name = g.name
    state.upgradeMode = g.upgradeMode
    state.productIds = [...g.productIds]
  }
}, { immediate: true })

const productItems = computed(() =>
  props.products.map(p => ({ label: p.name, value: p.id }))
)

async function onSubmit() {
  loading.value = true
  try {
    const updated = await $fetch<Group>(`/groups/${props.group.id}`, {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        name: state.name,
        upgradeMode: state.upgradeMode,
        productIds: state.productIds
      }
    })

    emit('updated', updated)
    toast.add({
      title: 'Группа обновлена',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось обновить группу.',
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
    title="Редактирование группы"
    description="Изменения вступают в силу сразу - ценообразование пересчитывается на следующей покупке."
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
          label="Режим доплаты"
          name="upgradeMode"
          description="Если включён: повторная или более дешёвая покупка из этой группы будет заблокирована, а более дорогая получит скидку на стоимость самой свежей купленной товара из группы."
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
