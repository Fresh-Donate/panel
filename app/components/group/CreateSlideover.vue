<script setup lang="ts">
import { z } from 'zod'
import type { Product, Group } from '~/types'

const props = defineProps<{
  products: Product[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  created: [group: Group]
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

function buildInitial(): FormState {
  return {
    name: '',
    upgradeMode: false,
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
    const group = await $fetch<Group>('/groups', {
      baseURL: config.public.apiBase as string,
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        name: state.name,
        upgradeMode: state.upgradeMode,
        productIds: state.productIds
      }
    })

    emit('created', group)
    toast.add({
      title: 'Группа создана',
      description: `"${group.name}" добавлена.`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось создать группу.',
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
    title="Новая группа"
    description="Группа объединяет товары — например, ранги одной линейки. С режимом доплаты невозможно купить более дешёвый товар, а более дорогой получит скидку на стоимость уже купленного."
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
          description="Можно оставить пустым — добавите товары позже."
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
            label="Создать группу"
            icon="i-lucide-layers"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
