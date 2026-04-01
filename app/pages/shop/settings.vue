<script setup lang="ts">
import { z } from 'zod'

const toast = useToast()

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

const schema = z.object({
  name: z.string().min(1, 'Название магазина обязательно').max(64, 'Максимум 64 символа'),
  description: z.string().max(500, 'Максимум 500 символов').optional(),
  color: z.string().min(1, 'Выберите цвет')
})

type ShopSettingsSchema = z.output<typeof schema>

const state = reactive<ShopSettingsSchema>({
  name: 'FreshDonate Shop',
  description: 'Лучший магазин для вашего сервера. Покупайте привилегии, ресурсы и многое другое!',
  color: 'sky'
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    // TODO: API call to save settings
    await new Promise(resolve => setTimeout(resolve, 500))
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
      <UPageCard
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
