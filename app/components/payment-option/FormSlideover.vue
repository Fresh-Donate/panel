<script setup lang="ts">
import { z } from 'zod'
import type { PaymentOption } from '~/types'

const props = defineProps<{
  option?: PaymentOption | null
  providers: { providerId: string, name: string }[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  saved: [option: PaymentOption]
}>()

const api = useApi()
const notify = useNotify()
const saving = ref(false)

const isEdit = computed(() => !!props.option)

function close() {
  open.value = false
}

const schema = z.object({
  name: z.string().min(1, 'Название обязательно').max(128, 'Макс. 128 символов'),
  icon: z.string().min(1, 'Иконка обязательна').max(128, 'Макс. 128 символов'),
  mode: z.enum(['provider', 'redirect']),
  providerId: z.string().max(32),
  redirectUrl: z.string().max(1024)
}).superRefine((d, ctx) => {
  if (d.mode === 'provider' && !d.providerId) {
    ctx.addIssue({ code: 'custom', path: ['providerId'], message: 'Выберите платёжную систему' })
  }
  if (d.mode === 'redirect' && !d.redirectUrl.trim()) {
    ctx.addIssue({ code: 'custom', path: ['redirectUrl'], message: 'Укажите ссылку для перенаправления' })
  }
})

type FormState = z.input<typeof schema>

function stateFrom(o?: PaymentOption | null): FormState {
  return {
    name: o?.name ?? '',
    icon: o?.icon ?? '',
    mode: o?.redirectUrl ? 'redirect' : 'provider',
    providerId: o ? o.providerId : (props.providers[0]?.providerId ?? ''),
    redirectUrl: o?.redirectUrl ?? ''
  }
}

const state = reactive<FormState>(stateFrom())

watch(open, (val) => {
  if (val) Object.assign(state, stateFrom(props.option))
}, { immediate: true })

const modeItems = [
  { label: 'Через платёжную систему', value: 'provider' as const },
  { label: 'Перенаправление по ссылке', value: 'redirect' as const }
]

const providerItems = computed(() =>
  props.providers.map(p => ({ label: p.name, value: p.providerId }))
)

async function onSubmit() {
  saving.value = true
  try {
    const body = {
      name: state.name,
      icon: state.icon,
      providerId: state.mode === 'provider' ? state.providerId : '',
      redirectUrl: state.mode === 'redirect' ? state.redirectUrl.trim() : null
    }
    const saved = props.option
      ? await api<PaymentOption>(`/payment-options/${props.option.id}`, { method: 'PUT', body })
      : await api<PaymentOption>('/payment-options', { method: 'POST', body })
    emit('saved', saved)
    notify.success(isEdit.value ? 'Метод обновлён' : 'Метод добавлен', `"${saved.name}" успешно сохранён.`)
  } catch (err) {
    notify.apiError(err, isEdit.value ? 'Не удалось обновить метод оплаты.' : 'Не удалось создать метод оплаты.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? 'Редактирование метода оплаты' : 'Новый метод оплаты'"
    :description="isEdit ? 'Измените настройки метода оплаты.' : 'Добавьте новый вариант оплаты для покупателей.'"
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
          description="Текст на кнопке в магазине."
          required
        >
          <UInput
            v-model="state.name"
            placeholder="Российские карты и СБП"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Иконка"
          name="icon"
          description="Название иконки Lucide (например i-lucide-credit-card)."
          required
        >
          <UInput
            v-model="state.icon"
            placeholder="i-lucide-credit-card"
            class="w-full"
          />
          <div
            v-if="state.icon"
            class="flex items-center gap-2 mt-2 text-sm text-muted"
          >
            <span>Предпросмотр:</span>
            <UIcon
              :name="state.icon"
              class="size-5"
            />
          </div>
        </UFormField>

        <UFormField
          label="Тип обработки"
          name="mode"
          description="Через подключённую платёжную систему или редиректом по произвольной ссылке."
          required
        >
          <USelectMenu
            v-model="state.mode"
            :items="modeItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="state.mode === 'provider'"
          label="Платёжная система"
          name="providerId"
          description="Какая платёжная система будет обрабатывать оплату."
          required
        >
          <USelectMenu
            v-model="state.providerId"
            :items="providerItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-else
          label="Ссылка для перенаправления"
          name="redirectUrl"
          description="Доступные плейсхолдеры: {nickname}, {email}, {amount}, {price}, {currency}, {product}, {count}, {productId}."
          required
        >
          <UInput
            v-model="state.redirectUrl"
            placeholder="https://example.com/pay?sum={amount}&user={nickname}"
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
            :label="isEdit ? 'Сохранить' : 'Создать'"
            :icon="isEdit ? 'i-lucide-save' : 'i-lucide-plus'"
            :loading="saving"
          />
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
