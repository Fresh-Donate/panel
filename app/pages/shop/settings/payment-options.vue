<script setup lang="ts">
import { z } from 'zod'

interface PaymentOptionItem {
  id: string
  name: string
  icon: string
  providerId: string
  redirectUrl: string | null
  sortOrder: number
  enabled: boolean
}

type OptionMode = 'provider' | 'redirect'

interface ProviderChoice {
  providerId: string
  name: string
}

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const fetching = ref(true)
const saving = ref(false)
const options = ref<PaymentOptionItem[]>([])
const providers = ref<ProviderChoice[]>([])

const showCreate = ref(false)
const editingOption = ref<PaymentOptionItem | null>(null)
const showEdit = ref(false)

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

interface FormState {
  name: string
  icon: string
  mode: OptionMode
  providerId: string
  redirectUrl: string
}

const createState = reactive<FormState>({
  name: '',
  icon: '',
  mode: 'provider',
  providerId: '',
  redirectUrl: ''
})

const editState = reactive<FormState>({
  name: '',
  icon: '',
  mode: 'provider',
  providerId: '',
  redirectUrl: ''
})

const modeItems = [
  { label: 'Через платёжную систему', value: 'provider' as const },
  { label: 'Перенаправление по ссылке', value: 'redirect' as const }
]

const providerItems = computed(() =>
  providers.value.map(p => ({ label: p.name, value: p.providerId }))
)

function getProviderName(providerId: string): string {
  return providers.value.find(p => p.providerId === providerId)?.name || providerId
}

function describeOption(option: PaymentOptionItem): string {
  return option.redirectUrl ? 'Перенаправление по ссылке' : getProviderName(option.providerId)
}

async function fetchData() {
  fetching.value = true
  try {
    const [optionsData, providersData] = await Promise.all([
      $fetch<PaymentOptionItem[]>('/payment-options/all', {
        baseURL: config.public.apiBase as string,
        headers: { Authorization: `Bearer ${token.value}` }
      }),
      $fetch<ProviderChoice[]>('/payment-providers', {
        baseURL: config.public.apiBase as string,
        headers: { Authorization: `Bearer ${token.value}` }
      })
    ])
    options.value = optionsData
    providers.value = providersData.map(p => ({ providerId: p.providerId, name: p.name }))
  } catch {
    toast.add({
      title: 'Ошибка загрузки',
      description: 'Не удалось загрузить данные.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    fetching.value = false
  }
}

onMounted(fetchData)

function openCreate() {
  createState.name = ''
  createState.icon = ''
  createState.mode = 'provider'
  createState.providerId = providers.value[0]?.providerId || ''
  createState.redirectUrl = ''
  showCreate.value = true
}

function openEdit(option: PaymentOptionItem) {
  editingOption.value = option
  editState.name = option.name
  editState.icon = option.icon
  editState.mode = option.redirectUrl ? 'redirect' : 'provider'
  editState.providerId = option.providerId
  editState.redirectUrl = option.redirectUrl ?? ''
  showEdit.value = true
}

function buildPayload(s: FormState) {
  return {
    name: s.name,
    icon: s.icon,
    providerId: s.mode === 'provider' ? s.providerId : '',
    redirectUrl: s.mode === 'redirect' ? s.redirectUrl.trim() : null
  }
}

async function onCreate() {
  saving.value = true
  try {
    const created = await $fetch<PaymentOptionItem>('/payment-options', {
      baseURL: config.public.apiBase as string,
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: buildPayload(createState)
    })
    options.value.push(created)
    showCreate.value = false
    toast.add({
      title: 'Метод добавлен',
      description: `"${created.name}" успешно создан.`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось создать метод оплаты.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function onEdit() {
  if (!editingOption.value) return
  saving.value = true
  try {
    const updated = await $fetch<PaymentOptionItem>(`/payment-options/${editingOption.value.id}`, {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: buildPayload(editState)
    })
    const idx = options.value.findIndex(o => o.id === updated.id)
    if (idx !== -1) options.value[idx] = updated
    showEdit.value = false
    toast.add({
      title: 'Метод обновлён',
      description: `"${updated.name}" успешно сохранён.`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось обновить метод оплаты.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(option: PaymentOptionItem) {
  try {
    const updated = await $fetch<PaymentOptionItem>(`/payment-options/${option.id}`, {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { enabled: !option.enabled }
    })
    const idx = options.value.findIndex(o => o.id === updated.id)
    if (idx !== -1) options.value[idx] = updated
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось изменить статус.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

async function deleteOption(option: PaymentOptionItem) {
  try {
    await $fetch(`/payment-options/${option.id}`, {
      baseURL: config.public.apiBase as string,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })
    options.value = options.value.filter(o => o.id !== option.id)
    toast.add({
      title: 'Метод удалён',
      description: `"${option.name}" удалён.`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось удалить метод оплаты.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="payment-options">
    <template #header>
      <UDashboardNavbar title="Методы оплаты">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            label="Добавить"
            icon="i-lucide-plus"
            @click="openCreate"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="fetching"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <div v-else>
        <UPageCard
          title="Методы оплаты в магазине"
          description="Настройте варианты оплаты, которые увидят покупатели. Каждый метод привязан к платёжной системе."
        >
          <!-- Empty state -->
          <div
            v-if="options.length === 0"
            class="text-center py-12"
          >
            <UIcon
              name="i-lucide-credit-card"
              class="size-16 text-muted/20 mx-auto"
            />
            <p class="mt-4 text-muted">
              Нет методов оплаты
            </p>
            <UButton
              label="Добавить первый метод"
              icon="i-lucide-plus"
              variant="soft"
              class="mt-3"
              @click="openCreate"
            />
          </div>

          <!-- Options list -->
          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="option in options"
              :key="option.id"
              class="flex items-center justify-between p-4 rounded-xl border border-default"
              :class="option.enabled ? 'bg-elevated' : 'opacity-60'"
            >
              <div class="flex items-center gap-4 min-w-0">
                <USwitch
                  :model-value="option.enabled"
                  @update:model-value="toggleEnabled(option)"
                />

                <div class="size-10 rounded-lg bg-muted/10 flex items-center justify-center shrink-0">
                  <UIcon
                    :name="option.icon"
                    class="size-5"
                  />
                </div>

                <div class="min-w-0">
                  <p class="font-semibold truncate">
                    {{ option.name }}
                  </p>
                  <p class="text-xs text-muted mt-0.5 truncate">
                    {{ describeOption(option) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  square
                  @click="openEdit(option)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  color="error"
                  size="sm"
                  square
                  @click="deleteOption(option)"
                />
              </div>
            </div>
          </div>

          <p
            v-if="options.length > 0"
            class="text-xs text-muted mt-3"
          >
            Покупатели увидят только включённые методы оплаты.
          </p>
        </UPageCard>
      </div>

      <!-- Create Slideover -->
      <USlideover
        v-model:open="showCreate"
        title="Новый метод оплаты"
        description="Добавьте новый вариант оплаты для покупателей."
      >
        <template #body>
          <UForm
            :schema="schema"
            :state="createState"
            class="space-y-5"
            @submit="onCreate"
          >
            <UFormField
              label="Название"
              name="name"
              description="Текст на кнопке в магазине."
              required
            >
              <UInput
                v-model="createState.name"
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
                v-model="createState.icon"
                placeholder="i-lucide-credit-card"
                class="w-full"
              />
              <div
                v-if="createState.icon"
                class="flex items-center gap-2 mt-2 text-sm text-muted"
              >
                <span>Предпросмотр:</span>
                <UIcon
                  :name="createState.icon"
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
                v-model="createState.mode"
                :items="modeItems"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="createState.mode === 'provider'"
              label="Платёжная система"
              name="providerId"
              description="Какая платёжная система будет обрабатывать оплату."
              required
            >
              <USelectMenu
                v-model="createState.providerId"
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
                v-model="createState.redirectUrl"
                placeholder="https://example.com/pay?sum={amount}&user={nickname}"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-2">
              <UButton
                label="Отмена"
                variant="ghost"
                color="neutral"
                @click="showCreate = false"
              />
              <UButton
                type="submit"
                label="Создать"
                icon="i-lucide-plus"
                :loading="saving"
              />
            </div>
          </UForm>
        </template>
      </USlideover>

      <!-- Edit Slideover -->
      <USlideover
        v-model:open="showEdit"
        title="Редактирование метода оплаты"
        description="Измените настройки метода оплаты."
      >
        <template #body>
          <UForm
            :schema="schema"
            :state="editState"
            class="space-y-5"
            @submit="onEdit"
          >
            <UFormField
              label="Название"
              name="name"
              description="Текст на кнопке в магазине."
              required
            >
              <UInput
                v-model="editState.name"
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
                v-model="editState.icon"
                placeholder="i-lucide-credit-card"
                class="w-full"
              />
              <div
                v-if="editState.icon"
                class="flex items-center gap-2 mt-2 text-sm text-muted"
              >
                <span>Предпросмотр:</span>
                <UIcon
                  :name="editState.icon"
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
                v-model="editState.mode"
                :items="modeItems"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="editState.mode === 'provider'"
              label="Платёжная система"
              name="providerId"
              description="Какая платёжная система будет обрабатывать оплату."
              required
            >
              <USelectMenu
                v-model="editState.providerId"
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
                v-model="editState.redirectUrl"
                placeholder="https://example.com/pay?sum={amount}&user={nickname}"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-2">
              <UButton
                label="Отмена"
                variant="ghost"
                color="neutral"
                @click="showEdit = false"
              />
              <UButton
                type="submit"
                label="Сохранить"
                icon="i-lucide-save"
                :loading="saving"
              />
            </div>
          </UForm>
        </template>
      </USlideover>
    </template>
  </UDashboardPanel>
</template>
