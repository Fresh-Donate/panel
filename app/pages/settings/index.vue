<script setup lang="ts">
import { z } from 'zod'

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const schema = z.object({
  demo_payments: z.boolean()
})

type SettingsSchema = z.output<typeof schema>

const state = reactive<SettingsSchema>({
  demo_payments: false
})

const loading = ref(false)
const fetching = ref(true)

// Load settings from API
async function fetchSettings() {
  fetching.value = true
  try {
    const data = await $fetch<SettingsSchema>('/settings', {
      baseURL: config.public.apiBase as string,
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    state.demo_payments = data.demo_payments
  } catch {
    toast.add({
      title: 'Ошибка загрузки',
      description: 'Не удалось загрузить настройки.',
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
    const data = await $fetch<SettingsSchema>('/settings', {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        demo_payments: state.demo_payments
      }
    })
    state.demo_payments = data.demo_payments || false
    toast.add({
      title: 'Настройки сохранены',
      description: 'Настройки успешно обновлены.',
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
      <UDashboardNavbar title="Настройки">
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
        description="Ключевые настройки магазина и панели."
      >
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <UFormField
            label="Режим демо-платежей"
            name="name"
            description="Платежи из магазина будут автоматически приниматься и не будут взимать плату."
            required
          >
            <USwitch
              v-model="state.demo_payments"
              icon="i-lucide-store"
              class="w-full max-w-md"
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
