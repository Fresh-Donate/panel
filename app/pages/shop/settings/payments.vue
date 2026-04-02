<script setup lang="ts">
import type { PaymentProvider } from '~/types'

const toast = useToast()

const selectedProviderId = ref('yookassa')

const providers = reactive<PaymentProvider[]>([
  {
    id: 'yookassa',
    name: 'ЮKassa',
    description: 'Приём платежей для РФ: банковские карты, СБП, ЮMoney, SberPay, T-Pay',
    icon: 'i-lucide-credit-card',
    enabled: false,
    credentials: {
      shopId: '',
      secretKey: ''
    },
    methods: [
      { id: 'bank_card', name: 'Банковские карты', commission: 2.8, enabled: true },
      { id: 'sbp', name: 'СБП', commission: 0.4, enabled: true },
      { id: 'yoo_money', name: 'ЮMoney', commission: 3.0, enabled: true },
      { id: 'sber_pay', name: 'SberPay', commission: 2.8, enabled: false },
      { id: 't_pay', name: 'T-Pay', commission: 2.8, enabled: false },
      { id: 'qiwi', name: 'QIWI', commission: 6.0, enabled: false }
    ],
    commissionRule: { mode: 'seller' },
    supportedCurrencies: ['RUB']
  },
  {
    id: 'heleket',
    name: 'Heleket',
    description: 'Криптовалютные платежи: BTC, ETH, USDT и другие',
    icon: 'i-lucide-bitcoin',
    enabled: false,
    credentials: {
      apiKey: '',
      merchantId: ''
    },
    methods: [
      { id: 'btc', name: 'Bitcoin (BTC)', commission: 0.5, enabled: true },
      { id: 'eth', name: 'Ethereum (ETH)', commission: 0.5, enabled: true },
      { id: 'usdt_trc20', name: 'USDT (TRC-20)', commission: 0.5, enabled: true },
      { id: 'usdt_erc20', name: 'USDT (ERC-20)', commission: 0.5, enabled: false },
      { id: 'ltc', name: 'Litecoin (LTC)', commission: 0.5, enabled: false },
      { id: 'trx', name: 'TRON (TRX)', commission: 0.5, enabled: false }
    ],
    commissionRule: { mode: 'seller' },
    supportedCurrencies: ['USD', 'EUR', 'RUB']
  }
])

const selectedProvider = computed(() =>
  providers.find(p => p.id === selectedProviderId.value)!
)

function saveProvider() {
  toast.add({
    title: 'Настройки сохранены',
    description: `Настройки ${selectedProvider.value.name} успешно обновлены.`,
    icon: 'i-lucide-check-circle',
    color: 'success'
  })
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
      <div class="grid grid-cols-3 gap-6">
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
