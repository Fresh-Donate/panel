<script setup lang="ts">
import { z } from 'zod'

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const tailwindColors: Record<string, string> = {
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e'
}

const colorNames = Object.keys(tailwindColors)

const colorItems = colorNames.map(color => ({
  label: color.charAt(0).toUpperCase() + color.slice(1),
  value: color
}))

type OwnerType = '' | 'individual' | 'self_employed' | 'sole_proprietor' | 'legal_entity'

const ownerTypeItems: { label: string, value: OwnerType }[] = [
  { label: 'Не указывать', value: '' },
  { label: 'Физическое лицо', value: 'individual' },
  { label: 'Самозанятый (НПД)', value: 'self_employed' },
  { label: 'Индивидуальный предприниматель', value: 'sole_proprietor' },
  { label: 'Юридическое лицо', value: 'legal_entity' }
]

const schema = z.object({
  name: z.string().min(1, 'Название магазина обязательно').max(64, 'Максимум 64 символа'),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
  ip: z.string().min(1, 'Минимум 1 символ').max(64, 'Максимум 64 символа').optional(),
  color: z.string().min(1, 'Выберите цвет'),
  shopUrl: z.union([z.literal(''), z.string().url('Должен быть валидный URL').max(256, 'Максимум 256 символов')]).optional(),
  ownerName: z.string().max(256, 'Максимум 256 символов').optional(),
  ownerType: z.enum(['', 'individual', 'self_employed', 'sole_proprietor', 'legal_entity']).optional(),
  ownerInn: z.union([
    z.literal(''),
    z.string().regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать 10 или 12 цифр')
  ]).optional(),
  contactEmail: z.union([
    z.literal(''),
    z.string().email('Должен быть валидный email').max(256, 'Максимум 256 символов')
  ]).optional()
})

type ShopSettingsSchema = z.output<typeof schema>

const state = reactive<ShopSettingsSchema>({
  name: '',
  description: '',
  ip: 'play.example.com',
  color: 'sky',
  shopUrl: '',
  ownerName: '',
  ownerType: '',
  ownerInn: '',
  contactEmail: ''
})

const loading = ref(false)
const fetching = ref(true)

function applyData(data: ShopSettingsSchema) {
  state.name = data.name
  state.description = data.description || ''
  state.ip = data.ip
  state.color = data.color
  state.shopUrl = data.shopUrl || ''
  state.ownerName = data.ownerName || ''
  state.ownerType = data.ownerType || ''
  state.ownerInn = data.ownerInn || ''
  state.contactEmail = data.contactEmail || ''
}

// Load settings from API
async function fetchSettings() {
  fetching.value = true
  try {
    const data = await $fetch<ShopSettingsSchema>('/shop-settings', {
      baseURL: config.public.apiBase as string
    })
    applyData(data)
  } catch {
    toast.add({
      title: 'Ошибка загрузки',
      description: 'Не удалось загрузить настройки магазина.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    fetching.value = false
  }
}

onMounted(fetchSettings)

async function onSubmit() {
  loading.value = true
  try {
    const data = await $fetch<ShopSettingsSchema>('/shop-settings', {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        name: state.name,
        description: state.description,
        ip: state.ip,
        color: state.color,
        ...(state.shopUrl ? { shopUrl: state.shopUrl } : {}),
        ownerName: state.ownerName ?? '',
        ownerType: state.ownerType ?? '',
        ownerInn: state.ownerInn ?? '',
        contactEmail: state.contactEmail ?? ''
      }
    })
    applyData(data)
    toast.add({
      title: 'Настройки сохранены',
      description: 'Настройки магазина успешно обновлены.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось сохранить настройки.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="shop-settings">
    <template #header>
      <UDashboardNavbar title="Настройки магазина">
        <template #leading>
          <UDashboardSidebarCollapse />
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

      <UPageCard
        v-else
        title="Общие настройки"
        description="Основная информация о вашем магазине, которая будет отображаться покупателям."
      >
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <UFormField
            label="Название магазина"
            name="name"
            description="Отображается в шапке магазина и на вкладке браузера."
            required
          >
            <UInput
              v-model="state.name"
              placeholder="Введите название магазина"
              icon="i-lucide-store"
              class="w-full max-w-md"
            />
          </UFormField>

          <USeparator />

          <UFormField
            label="Описание"
            name="description"
            description="Краткое описание магазина для главной страницы."
          >
            <UTextarea
              v-model="state.description"
              placeholder="Расскажите о вашем магазине..."
              :rows="3"
              autoresize
              class="w-full max-w-lg"
            />
          </UFormField>

          <USeparator />

          <UFormField
            label="Адрес сервера"
            name="ip"
            description="IP для подключения к вашему серверу"
          >
            <UInput
              v-model="state.ip"
              placeholder="Например: play.example.com"
              icon="i-lucide-link"
              class="w-full max-w-lg"
            />
          </UFormField>

          <USeparator />

          <UFormField
            label="Адрес магазина"
            name="shopUrl"
            description="Публичный URL фронтенда магазина - используется для canonical-ссылок, Open Graph, sitemap.xml и кнопок «открыть магазин». Без слэша в конце. Если оставить пустым, будет использован адрес запроса."
          >
            <UInput
              v-model="state.shopUrl"
              placeholder="https://shop.example.com"
              icon="i-lucide-globe"
              class="w-full max-w-lg"
            />
          </UFormField>

          <USeparator />

          <UFormField
            label="Основной цвет"
            name="color"
            description="Цветовая палитра интерфейса магазина."
            required
          >
            <USelectMenu
              v-model="state.color"
              :items="colorItems"
              value-key="value"
              placeholder="Выберите цвет"
              class="w-full max-w-xs"
            >
              <template #leading>
                <span
                  class="size-3 rounded-full shrink-0"
                  :style="{ backgroundColor: tailwindColors[state.color] }"
                />
              </template>
            </USelectMenu>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="color in colorNames"
                :key="color"
                type="button"
                class="size-8 rounded-lg transition-all duration-150 cursor-pointer"
                :class="state.color === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-default scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'"
                :style="{ backgroundColor: tailwindColors[color] }"
                :title="color.charAt(0).toUpperCase() + color.slice(1)"
                @click="state.color = color"
              />
            </div>
          </UFormField>

          <USeparator />

          <div class="space-y-1">
            <p class="font-semibold">
              Юридическая информация
            </p>
            <p class="text-sm text-muted">
              Используется в публичных документах магазина (оферта, соглашение, политика). Все поля опциональны - если оставить пустыми, в документах будет "не указано".
            </p>
          </div>

          <UFormField
            label="Владелец магазина"
            name="ownerName"
            description="ФИО (для физлица / самозанятого / ИП) или полное наименование организации."
          >
            <UInput
              v-model="state.ownerName"
              placeholder="Иванов Иван Иванович"
              icon="i-lucide-user"
              class="w-full max-w-lg"
            />
          </UFormField>

          <UFormField
            label="Тип владельца"
            name="ownerType"
            description="Влияет на формулировки в публичной оферте и политике конфиденциальности."
          >
            <USelectMenu
              v-model="state.ownerType"
              :items="ownerTypeItems"
              value-key="value"
              class="w-full max-w-md"
            />
          </UFormField>

          <UFormField
            label="ИНН"
            name="ownerInn"
            description="10 цифр для юрлиц или 12 цифр для физлиц / самозанятых / ИП. Можно не указывать."
          >
            <UInput
              v-model="state.ownerInn"
              placeholder="123456789012"
              icon="i-lucide-hash"
              class="w-full max-w-xs"
              :maxlength="12"
            />
          </UFormField>

          <UFormField
            label="Контактный email"
            name="contactEmail"
            description="На него игроки будут писать запросы по 152-ФЗ (доступ / удаление персональных данных) и претензии по покупкам."
          >
            <UInput
              v-model="state.contactEmail"
              type="email"
              placeholder="contact@example.com"
              icon="i-lucide-mail"
              class="w-full max-w-lg"
            />
          </UFormField>

          <USeparator />

          <div>
            <UButton
              type="submit"
              label="Сохранить"
              icon="i-lucide-save"
              :loading="loading"
            />
          </div>
        </UForm>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
