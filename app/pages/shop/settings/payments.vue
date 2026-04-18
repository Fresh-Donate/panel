<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const selectedProviderId = ref('yookassa')
const providers = reactive<PaymentProvider[]>([])
const fetching = ref(true)
const saving = ref(false)

async function fetchProviders() {
  fetching.value = true
  try {
    const data = await $fetch<PaymentProvider[]>('/payment-providers', {
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    providers.splice(0, providers.length, ...data)
    if (data.length > 0 && !data.find(p => p.providerId === selectedProviderId.value)) {
      selectedProviderId.value = data[0].providerId
    }
  } catch {
    toast.add({
      title: 'Ошибка загрузки',
      description: 'Не удалось загрузить платёжные системы.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    fetching.value = false
  }
}

onMounted(fetchProviders)

const selectedProvider = computed(() =>
  providers.find(p => p.providerId === selectedProviderId.value)!
)

async function saveProvider() {
  const provider = selectedProvider.value
  if (!provider) return

  saving.value = true
  try {
    const updated = await $fetch<PaymentProvider>(`/payment-providers/${provider.providerId}`, {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        enabled: provider.enabled,
        credentials: provider.credentials,
        methods: provider.methods,
        commissionRule: provider.commissionRule
      }
    })

    const idx = providers.findIndex(p => p.providerId === updated.providerId)
    if (idx !== -1) {
      Object.assign(providers[idx], updated)
    }

    toast.add({
      title: 'Настройки сохранены',
      description: `Настройки ${provider.name} успешно обновлены.`,
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
    saving.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="payment-settings">
    <template #header>
      <UDashboardNavbar title="Платёжные системы">
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

      <div
        v-else-if="providers.length > 0"
        class="grid grid-cols-3 gap-6"
      >
        <!-- Left: Provider Settings -->
        <div class="space-y-6 min-w-0 col-span-2">
          <PaymentProviderHeader
            :provider="selectedProvider"
            @update:enabled="selectedProvider.enabled = $event"
          />

          <template v-if="selectedProvider.enabled">
            <PaymentCredentialsCard
              :provider="selectedProvider"
              @update:credential="(key, val) => selectedProvider.credentials[key] = val"
            />

            <PaymentMethodsList :methods="selectedProvider.methods" />

            <PaymentCommissionRuleCard
              v-model:rule="selectedProvider.commissionRule"
              :methods="selectedProvider.methods"
            />

            <div class="flex justify-end">
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                :loading="saving"
                @click="saveProvider"
              />
            </div>
          </template>

          <div
            v-else
            class="text-center py-12"
          >
            <UIcon
              :name="selectedProvider.icon"
              class="size-16 text-muted/20 mx-auto"
            />
            <p class="mt-4 text-muted">
              Включите {{ selectedProvider.name }} чтобы настроить
            </p>
          </div>
        </div>

        <!-- Right: Provider List -->
        <PaymentProviderList
          v-model:selected-id="selectedProviderId"
          :providers="providers"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
