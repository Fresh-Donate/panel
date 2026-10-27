<script setup lang="ts">
import { z } from 'zod'
import { PRODUCT_TYPES } from '~/types'
import type { Group, Product, ProductType, Server } from '~/types'

const props = defineProps<{
  product?: Product | null
  servers?: Server[]
  multiServerEnabled?: boolean
  groups?: Group[]
  defaultGroupIds?: string[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  saved: [product: Product]
}>()

const api = useApi()
const notify = useNotify()
const loading = ref(false)

const isEdit = computed(() => !!props.product)

function close() {
  open.value = false
}

const schema = z.object({
  name: z.string().min(1, 'Название обязательно').max(128, 'Макс. 128 символов'),
  price: z.number().min(0.01, 'Цена должна быть больше 0'),
  currency: z.enum(['RUB', 'USD', 'EUR'], 'Выберите валюту'),
  quantity: z.number().int().min(0, 'Минимум 0'),
  description: z.string().max(1000, 'Макс. 1000 символов').optional(),
  type: z.enum(['item', 'privilege', 'currency', 'other'], 'Выберите тип'),
  commands: z.string().optional(),
  allowCustomCount: z.boolean(),
  forceDelivery: z.boolean(),
  imageUrl: z.string().max(512, 'Слишком длинная ссылка').optional()
})

type FormState = z.input<typeof schema>

function stateFrom(p?: Product | null): FormState {
  return {
    name: p?.name ?? '',
    price: p?.price ?? 0,
    currency: p?.currency ?? 'RUB',
    quantity: p?.quantity ?? 1,
    description: p?.description ?? '',
    type: p?.type ?? 'item',
    commands: p?.commands?.join('\n') ?? '',
    allowCustomCount: p?.allowCustomCount ?? false,
    forceDelivery: p?.forceDelivery ?? false,
    imageUrl: p?.imageUrl ?? ''
  }
}

const state = reactive<FormState>(stateFrom())
const selectedServerIds = ref<string[]>([])
const selectedGroupIds = ref<string[]>([])

watch(open, (val) => {
  if (!val) return
  Object.assign(state, stateFrom(props.product))
  selectedServerIds.value = [...(props.product?.serverIds ?? [])]
  const product = props.product
  selectedGroupIds.value = product
    ? (props.groups ?? []).filter(g => g.productIds.includes(product.id)).map(g => g.id)
    : [...(props.defaultGroupIds ?? [])]
}, { immediate: true })

const forceDeliveryLocked = computed(() => selectedServerIds.value.length >= 2)
watch(forceDeliveryLocked, (locked) => {
  if (locked) state.forceDelivery = true
})

const serverOptions = computed(() => (props.servers || []).map(s => ({ label: s.name, value: s.id })))
const groupOptions = computed(() => (props.groups || []).map(g => ({ label: g.name, value: g.id })))

watch(() => state.type, (t) => {
  if (t === 'privilege') state.quantity = 1
})

const commandHints: Record<ProductType, string> = {
  item: '{player} - ник игрока, {amount} - количество.',
  privilege: '{player} - ник игрока.',
  currency: '{player} - ник игрока, {amount} - сумма.',
  other: '{player} - ник игрока, {amount} - количество.'
}

const commandPlaceholders: Record<ProductType, string> = {
  item: 'give {player} diamond {amount}',
  privilege: 'lp user {player} parent set vip',
  currency: 'eco give {player} {amount}',
  other: 'say {player} purchased item'
}

const quantityLabels: Record<ProductType, string> = {
  item: 'Количество предметов',
  privilege: 'Кол-во (дней)',
  currency: 'Сумма валюты',
  other: 'Количество'
}

const commandHint = computed(() => commandHints[state.type])
const commandPlaceholder = computed(() => commandPlaceholders[state.type])
const qLabel = computed(() => quantityLabels[state.type])

async function onSubmit() {
  loading.value = true
  try {
    const body = {
      name: state.name,
      price: state.price,
      currency: state.currency,
      quantity: state.type === 'privilege' ? 1 : state.quantity,
      description: state.description || '',
      type: state.type,
      commands: state.commands ? state.commands.split('\n').filter(Boolean) : [],
      allowCustomCount: state.type === 'privilege' ? false : state.allowCustomCount,
      forceDelivery: state.forceDelivery,
      imageUrl: state.imageUrl || '',
      serverIds: props.multiServerEnabled ? selectedServerIds.value : undefined,
      groupIds: selectedGroupIds.value
    }
    const saved = props.product
      ? await api<Product>(`/products/${props.product.id}`, { method: 'PUT', body })
      : await api<Product>('/products', { method: 'POST', body })

    emit('saved', saved)
    notify.success(isEdit.value ? 'Товар обновлён' : 'Товар создан')
  } catch (err) {
    notify.apiError(err, isEdit.value ? 'Не удалось обновить товар.' : 'Не удалось создать товар.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? 'Редактирование товара' : 'Новый товар'"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          label="Тип товара"
          name="type"
          required
        >
          <USelectMenu
            v-model="state.type"
            :items="PRODUCT_TYPES"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Название"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="VIP, Набор алмазов, 1000 монет..."
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-3 gap-3">
          <UFormField
            label="Цена"
            name="price"
            required
            class="col-span-2"
          >
            <UInput
              v-model.number="state.price"
              type="number"
              :min="0.01"
              :step="0.01"
              placeholder="99"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Валюта"
            name="currency"
            required
          >
            <USelectMenu
              v-model="state.currency"
              :items="CURRENCY_OPTIONS"
              value-key="value"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          v-if="state.type !== 'privilege'"
          :label="qLabel"
          name="quantity"
          required
        >
          <UInput
            v-model.number="state.quantity"
            type="number"
            :min="1"
            placeholder="1"
            class="w-full max-w-xs"
          />
        </UFormField>

        <UFormField
          v-if="state.type !== 'privilege'"
          label="Пользовательское количество"
          name="allowCustomCount"
          description="Покупатель сам указывает количество."
          required
        >
          <USwitch
            v-model="state.allowCustomCount"
            class="w-full max-w-xs"
          />
        </UFormField>

        <UFormField
          label="Выдавать принудительно"
          name="forceDelivery"
          :description="forceDeliveryLocked ? 'Товар привязан к нескольким серверам.' : 'Выдать, даже если игрока нет на сервере.'"
          required
        >
          <USwitch
            v-model="state.forceDelivery"
            :disabled="forceDeliveryLocked"
            class="w-full max-w-xs"
          />
        </UFormField>

        <UFormField
          v-if="multiServerEnabled"
          label="Сервера выдачи"
          name="servers"
          description="Выдаётся на каждом выбранном. Без серверов товар скрыт на витрине."
        >
          <USelectMenu
            v-model="selectedServerIds"
            :items="serverOptions"
            value-key="value"
            multiple
            placeholder="Выберите сервера..."
            class="w-full"
          />
          <p
            v-if="serverOptions.length === 0"
            class="text-xs text-warning mt-1.5"
          >
            Серверов пока нет. Добавьте их в разделе «Настройки → Серверы».
          </p>
        </UFormField>

        <UFormField
          v-if="groupOptions.length > 0"
          label="Группы"
          name="groups"
        >
          <USelectMenu
            v-model="selectedGroupIds"
            :items="groupOptions"
            value-key="value"
            multiple
            placeholder="Без группы"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Описание"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            placeholder="Краткое описание товара..."
            :rows="3"
            autoresize
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Изображение"
          name="imageUrl"
        >
          <UploadImageInput v-model:url="state.imageUrl" />
        </UFormField>

        <USeparator />

        <UFormField
          label="Команды выдачи"
          name="commands"
          :description="commandHint"
        >
          <UTextarea
            v-model="state.commands"
            :placeholder="commandPlaceholder"
            :rows="3"
            autoresize
            class="w-full font-mono text-sm"
          />
          <p class="text-xs text-muted mt-1.5">
            Каждая команда с новой строки. Выполняются от имени консоли сервера.
          </p>
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
            :label="isEdit ? 'Сохранить' : 'Создать товар'"
            :icon="isEdit ? 'i-lucide-save' : 'i-lucide-plus'"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
