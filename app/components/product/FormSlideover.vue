<script setup lang="ts">
import { z } from 'zod'
import { PRODUCT_TYPES } from '~/types'
import type { Product, ProductType, Server } from '~/types'

const props = defineProps<{
  product?: Product | null
  servers?: Server[]
  multiServerEnabled?: boolean
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

watch(open, (val) => {
  if (!val) return
  Object.assign(state, stateFrom(props.product))
  selectedServerIds.value = [...(props.product?.serverIds ?? [])]
}, { immediate: true })

const forceDeliveryLocked = computed(() => selectedServerIds.value.length >= 2)
watch(forceDeliveryLocked, (locked) => {
  if (locked) state.forceDelivery = true
})

const serverOptions = computed(() => (props.servers || []).map(s => ({ label: s.name, value: s.id })))

watch(() => state.type, (t) => {
  if (t === 'privilege') state.quantity = 1
})

const commandHints: Record<ProductType, string> = {
  item: 'Используйте {player} для ника игрока и {amount} для количества.\nПример: give {player} diamond {amount}',
  privilege: 'Используйте {player} для ника игрока.\nПример: lp user {player} parent set vip',
  currency: 'Используйте {player} для ника и {amount} для суммы.\nПример: eco give {player} {amount}',
  other: 'Используйте {player} для ника игрока и {amount} для количества.'
}

const commandPlaceholders: Record<ProductType, string> = {
  item: 'give {player} diamond {amount}',
  privilege: 'lp user {player} parent set vip',
  currency: 'eco give {player} {amount}',
  other: 'say {player} purchased item'
}

const quantityLabels: Record<ProductType, { label: string, description: string }> = {
  item: { label: 'Количество предметов', description: 'Сколько предметов получит игрок за эту цену.' },
  privilege: { label: 'Кол-во (дней)', description: 'Длительность привилегии в днях. 0 = навсегда.' },
  currency: { label: 'Сумма валюты', description: 'Сколько игровой валюты получит игрок.' },
  other: { label: 'Количество', description: 'Количество единиц за одну покупку.' }
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
      serverIds: props.multiServerEnabled ? selectedServerIds.value : undefined
    }
    const saved = props.product
      ? await api<Product>(`/products/${props.product.id}`, { method: 'PUT', body })
      : await api<Product>('/products', { method: 'POST', body })

    emit('saved', saved)
    notify.success(isEdit.value ? 'Товар обновлён' : 'Товар создан', `"${saved.name}" успешно сохранён.`)
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
    :description="isEdit ? 'Измените информацию о товаре.' : 'Заполните информацию о товаре.'"
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
          :label="qLabel.label"
          :description="qLabel.description"
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
          description="Разрешить пользователю ввод количества желаемого товара."
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
          :description="forceDeliveryLocked ? 'Включено автоматически: товар привязан к нескольким серверам.' : 'Выдача произойдёт даже если игрока нет на сервере.'"
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
          description="Товар будет выдан на каждом из выбранных серверов. Если ни одного - товар скрыт на витрине."
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
          label="Описание"
          name="description"
          description="Отображается покупателям в магазине."
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
          description="Загрузите файл (до 10 МБ) или вставьте ссылку. Картинка автоматически сжимается."
        >
          <ProductImageInput v-model:url="state.imageUrl" />
        </UFormField>

        <USeparator label="Команды" />

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
