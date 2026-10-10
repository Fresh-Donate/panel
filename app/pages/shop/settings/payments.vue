<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const api = useApi()
const notify = useNotify()
const settingsStore = useSettingsStore()

const selectedProviderId = ref('yookassa')
const providers = ref<PaymentProvider[]>([])
const fetching = ref(true)
const saving = ref(false)
const baseCurrency = computed(() => settingsStore.settings?.base_currency ?? 'RUB')

async function fetchProviders() {
  fetching.value = true
  try {
    const [data] = await Promise.all([
      api<PaymentProvider[]>('/payment-providers'),
      settingsStore.load()
    ])
    providers.value = data
    const first = data[0]
    if (first && !data.some(p => p.providerId === selectedProviderId.value)) {
      selectedProviderId.value = first.providerId
    }
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить платёжные системы.', 'Ошибка загрузки')
  } finally {
    fetching.value = false
  }
}

onMounted(fetchProviders)

const selectedProvider = computed(() =>
  providers.value.find(p => p.providerId === selectedProviderId.value)
)

async function saveProvider() {
  const provider = selectedProvider.value
  if (!provider) return

  saving.value = true
  try {
    const updated = await api<PaymentProvider>(`/payment-providers/${provider.providerId}`, {
      method: 'PUT',
      body: {
        enabled: provider.enabled,
        testMode: provider.testMode,
        credentials: provider.credentials,
        providerConfig: provider.providerConfig,
        commissionPercent: provider.commissionPercent,
        commissionRule: provider.commissionRule,
        supportedCurrencies: provider.supportedCurrencies,
        minAmount: provider.minAmount
      }
    })
    Object.assign(provider, updated)
    notify.success('Настройки сохранены')
  } catch (err) {
    notify.apiError(err, 'Не удалось сохранить настройки.')
  } finally {
    saving.value = false
  }
}

function setEnabled(enabled: boolean) {
  if (!selectedProvider.value) return
  selectedProvider.value.enabled = enabled
  saveProvider()
}

function setCredential(key: string, value: string) {
  if (selectedProvider.value) selectedProvider.value.credentials[key] = value
}

function setCoinPackage(denomination: string, packageId: string) {
  const provider = selectedProvider.value
  if (!provider) return
  const config = provider.providerConfig || {}
  provider.providerConfig = { ...config, coinPackages: { ...(config.coinPackages || {}), [denomination]: packageId } }
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
        v-else-if="selectedProvider"
        class="grid grid-cols-3 gap-6"
      >
        <!-- Left: Provider Settings -->
        <div class="space-y-6 min-w-0 col-span-2">
          <ProviderHeader
            :saving="saving"
            :provider="selectedProvider"
            @update:enabled="setEnabled"
            @update:test-mode="selectedProvider.testMode = $event"
          />

          <template v-if="selectedProvider.enabled">
            <ProviderAccountCurrencyCard
              :provider="selectedProvider"
              @update:currency="selectedProvider.supportedCurrencies = [$event]"
            />

            <ProviderCredentialsCard
              :provider="selectedProvider"
              @update:credential="setCredential"
            />

            <ProviderTebexCoinPackagesCard
              v-if="selectedProvider.providerId === 'tebex'"
              :provider="selectedProvider"
              @update:coin="setCoinPackage"
            />

            <ProviderFiscalizationCard
              v-if="selectedProvider.providerId === 'robokassa' || selectedProvider.providerId === 'yookassa'"
              :provider="selectedProvider"
              @update:config="selectedProvider.providerConfig = $event"
            />

            <ProviderCommissionPercentCard
              v-model:commission-percent="selectedProvider.commissionPercent"
            />

            <ProviderCommissionRuleCard
              v-model:rule="selectedProvider.commissionRule"
              :commission-percent="selectedProvider.commissionPercent"
              :currency="selectedProvider.supportedCurrencies[0]"
            />

            <ProviderMinAmountCard
              v-model:min-amount="selectedProvider.minAmount"
              :base-currency="baseCurrency"
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
              Включите {{ selectedProvider.name }}, чтобы настроить
            </p>
          </div>
        </div>

        <!-- Right: Provider List -->
        <ProviderList
          v-model:selected-id="selectedProviderId"
          :providers="providers"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
