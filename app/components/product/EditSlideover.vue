<script setup lang="ts">
import { z } from 'zod'
import type { Product, ProductType, Currency } from '~/types'

const props = defineProps<{
  product: Product
  productTypes: { value: ProductType, label: string, icon: string }[]
  currencies: { value: Currency, label: string }[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  updated: [product: Product]
}>()

const config = useRuntimeConfig()
const token = useCookie('auth_token')
const toast = useToast()
const loading = ref(false)

const schema = z.object({
  name: z.string().min(1, 'Название обязательно').max(128, 'Макс. 128 символов'),
  price: z.number().min(0.01, 'Цена должна быть больше 0'),
  currency: z.string().min(1, 'Выберите валюту'),
  quantity: z.number().int().min(0, 'Минимум 0'),
  description: z.string().max(1000, 'Макс. 1000 символов').optional(),
  type: z.string().min(1, 'Выберите тип'),
  commands: z.string().optional()
})

type FormState = z.input<typeof schema>

const state = reactive<FormState>({
  name: '',
  price: 0,
  currency: 'RUB',
  quantity: 1,
  description: '',
  type: 'item',
  commands: ''
})

watch(() => props.product, (p) => {
  if (p) {
    state.name = p.name
    state.price = p.price
    state.currency = p.currency
    state.quantity = p.quantity
    state.description = p.description || ''
    state.type = p.type
    state.commands = p.commands?.join('\n') || ''
  }
}, { immediate: true })

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

const commandHint = computed(() => commandHints[state.type as ProductType] ?? '')
const commandPlaceholder = computed(() => commandPlaceholders[state.type as ProductType] ?? '')
const qLabel = computed(() => quantityLabels[state.type as ProductType] ?? quantityLabels.other)

const typeItems = computed(() => props.productTypes.map(t => ({ label: t.label, value: t.value })))
const currencyItems = computed(() => props.currencies.map(c => ({ label: c.label, value: c.value })))

async function onSubmit() {
  loading.value = true
  try {
    const updated = await $fetch<Product>(`/products/${props.product.id}`, {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        name: state.name,
        price: state.price,
        currency: state.currency,
        quantity: state.quantity,
        description: state.description || '',
        type: state.type,
        commands: state.commands ? state.commands.split('\n').filter(Boolean) : []
      }
    })

    emit('updated', updated)
    toast.add({
      title: 'Товар обновлён',
      description: `«${updated.name}» успешно сохранён.`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось обновить товар.',
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
    title="Редактирование товара"
    description="Измените информацию о товаре."
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
            :items="typeItems"
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
              :items="currencyItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          :label="qLabel.label"
          :description="qLabel.description"
          name="quantity"
          required
        >
          <UInput
            v-model.number="state.quantity"
            type="number"
            :min="state.type === 'privilege' ? 0 : 1"
            placeholder="1"
            class="w-full max-w-xs"
          />
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
