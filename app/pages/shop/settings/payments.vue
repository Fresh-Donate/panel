<script setup lang="ts">
interface PaymentMethod {
  id: string
  name: string
  commission: number
  enabled: boolean
}

interface CommissionRule {
  mode: 'seller' | 'buyer' | 'split'
  customPercent?: number
}

interface PaymentProvider {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean

  credentials: Record<string, string>
  methods: PaymentMethod[]
  commissionRule: CommissionRule
  supportedCurrencies: string[]
}

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

const enabledMethodsCount = computed(() =>
  selectedProvider.value.methods.filter(m => m.enabled).length
)

const avgCommission = computed(() => {
  const enabled = selectedProvider.value.methods.filter(m => m.enabled)
  if (enabled.length === 0) return 0
  return +(enabled.reduce((sum, m) => sum + m.commission, 0) / enabled.length).toFixed(2)
})

const commissionModes = [
  {
    value: 'seller',
    label: 'Продавец оплачивает',
    description: 'Комиссия вычитается из суммы платежа'
  },
  {
    value: 'buyer',
    label: 'Покупатель оплачивает',
    description: 'Комиссия добавляется к цене товара'
  },
  {
    value: 'split',
    label: 'Поровну (50/50)',
    description: 'Комиссия делится пополам между вами и покупателем'
  }
]

const credentialLabels: Record<string, Record<string, { label: string, placeholder: string }>> = {
  yookassa: {
    shopId: { label: 'Shop ID', placeholder: 'Введите Shop ID из личного кабинета ЮKassa' },
    secretKey: { label: 'Секретный ключ', placeholder: 'Введите секретный ключ' }
  },
  heleket: {
    apiKey: { label: 'API Key', placeholder: 'Введите API ключ из Heleket' },
    merchantId: { label: 'Merchant ID', placeholder: 'Введите идентификатор мерчанта' }
  }
}

function examplePrice(method: PaymentMethod): string {
  const price = 100
  const rule = selectedProvider.value.commissionRule
  const comm = method.commission

  if (rule.mode === 'seller') {
    const receive = (price - price * comm / 100).toFixed(2)
    return `Покупатель платит ${price}₽ → вы получаете ${receive}₽`
  } else if (rule.mode === 'buyer') {
    const total = (price + price * comm / 100).toFixed(2)
    return `Цена ${price}₽ → покупатель платит ${total}₽ → вы получаете ${price}₽`
  } else {
    const halfComm = comm / 2
    const buyerPays = (price + price * halfComm / 100).toFixed(2)
    const sellerReceives = (price - price * halfComm / 100).toFixed(2)
    return `Покупатель платит ${buyerPays}₽ → вы получаете ${sellerReceives}₽`
  }
}

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
          <!-- Header -->
          <UPageCard>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div
                  class="size-12 rounded-xl flex items-center justify-center"
                  :class="selectedProvider.enabled ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'"
                >
                  <UIcon
                    :name="selectedProvider.icon"
                    class="size-6"
                  />
                </div>
                <div>
                  <h3 class="text-lg font-bold">
                    {{ selectedProvider.name }}
                  </h3>
                  <p class="text-sm text-muted">
                    {{ selectedProvider.description }}
                  </p>
                </div>
              </div>
              <USwitch v-model="selectedProvider.enabled" />
            </div>

            <!-- Quick stats -->
            <div
              v-if="selectedProvider.enabled"
              class="flex gap-6 mt-4 pt-4 border-t border-default"
            >
              <div>
                <p class="text-xs text-muted">
                  Методов включено
                </p>
                <p class="text-lg font-bold">
                  {{ enabledMethodsCount }} / {{ selectedProvider.methods.length }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted">
                  Средняя комиссия
                </p>
                <p class="text-lg font-bold">
                  {{ avgCommission }}%
                </p>
              </div>
              <div>
                <p class="text-xs text-muted">
                  Валюты
                </p>
                <p class="text-lg font-bold">
                  {{ selectedProvider.supportedCurrencies.join(', ') }}
                </p>
              </div>
            </div>
          </UPageCard>

          <!-- Content when enabled -->
          <template v-if="selectedProvider.enabled">
            <!-- Credentials -->
            <UPageCard
              title="Подключение"
              description="Данные для авторизации в платёжной системе."
            >
              <div class="space-y-4">
                <UFormField
                  v-for="(_, key) in selectedProvider.credentials"
                  :key="key"
                  :label="credentialLabels[selectedProvider.id]?.[key]?.label || key"
                >
                  <UInput
                    v-model="selectedProvider.credentials[key]"
                    :type="key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') ? 'password' : 'text'"
                    :placeholder="credentialLabels[selectedProvider.id]?.[key]?.placeholder || ''"
                    class="w-full max-w-lg"
                  />
                </UFormField>
              </div>
            </UPageCard>

            <!-- Payment Methods -->
            <UPageCard
              title="Методы оплаты"
              description="Включайте и настраивайте отдельные методы оплаты. У каждого метода своя комиссия."
            >
              <div class="space-y-2">
                <div
                  v-for="method in selectedProvider.methods"
                  :key="method.id"
                  class="flex items-center justify-between p-3 rounded-lg border border-default"
                  :class="method.enabled ? 'bg-elevated' : 'opacity-60'"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <USwitch
                      v-model="method.enabled"
                      size="sm"
                    />
                    <span
                      class="font-medium text-sm"
                      :class="method.enabled ? '' : 'text-muted'"
                    >{{ method.name }}</span>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <div class="flex items-center gap-1.5">
                      <UInput
                        v-model.number="method.commission"
                        type="number"
                        :min="0"
                        :max="100"
                        :step="0.1"
                        size="sm"
                        class="w-20"
                        :disabled="!method.enabled"
                      />
                      <span class="text-sm text-muted">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <p class="text-xs text-muted mt-3">
                Указывайте актуальные комиссии из вашего личного кабинета платёжной системы. Они могут отличаться от стандартных тарифов.
              </p>
            </UPageCard>

            <!-- Commission Rule -->
            <UPageCard
              title="Распределение комиссии"
              description="Определите, кто оплачивает комиссию платёжной системы."
            >
              <div class="space-y-3">
                <button
                  v-for="mode in commissionModes"
                  :key="mode.value"
                  type="button"
                  class="w-full text-left p-4 rounded-lg border transition-all cursor-pointer"
                  :class="selectedProvider.commissionRule.mode === mode.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-default bg-elevated hover:border-muted'"
                  @click="selectedProvider.commissionRule.mode = mode.value as CommissionRule['mode']"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="size-4 rounded-full border-2 flex items-center justify-center shrink-0"
                      :class="selectedProvider.commissionRule.mode === mode.value
                        ? 'border-primary'
                        : 'border-muted'"
                    >
                      <span
                        v-if="selectedProvider.commissionRule.mode === mode.value"
                        class="size-2 rounded-full bg-primary"
                      />
                    </span>
                    <div>
                      <p class="font-medium text-sm">
                        {{ mode.label }}
                      </p>
                      <p class="text-xs text-muted mt-0.5">
                        {{ mode.description }}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Commission example -->
              <div class="mt-4 p-4 rounded-lg bg-muted/5 border border-default">
                <p class="text-xs font-medium text-muted mb-2">
                  Пример расчёта (товар за 100₽)
                </p>
                <div class="space-y-1.5">
                  <div
                    v-for="method in selectedProvider.methods.filter(m => m.enabled)"
                    :key="method.id"
                    class="flex items-start gap-2 text-xs"
                  >
                    <span class="font-medium shrink-0 min-w-24">{{ method.name }}:</span>
                    <span class="text-muted">{{ examplePrice(method) }}</span>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Save -->
            <div class="flex justify-end">
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                @click="saveProvider"
              />
            </div>
          </template>

          <!-- Disabled state -->
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
        <div class="space-y-3">
          <p class="text-sm font-medium text-muted mb-2">
            Доступные системы
          </p>

          <button
            v-for="provider in providers"
            :key="provider.id"
            type="button"
            class="w-full text-left rounded-xl border p-4 transition-all cursor-pointer"
            :class="selectedProviderId === provider.id
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-default bg-elevated hover:border-muted'"
            @click="selectedProviderId = provider.id"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="size-10 rounded-lg flex items-center justify-center shrink-0"
                  :class="provider.enabled ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'"
                >
                  <UIcon
                    :name="provider.icon"
                    class="size-5"
                  />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold truncate">{{ provider.name }}</span>

                  </div>
                  <p class="text-xs text-muted truncate mt-0.5">
                    {{ provider.description }}
                  </p>
                </div>
              </div>
              <span
                class="size-2.5 rounded-full shrink-0 ml-3"
                :class="provider.enabled ? 'bg-green-500' : 'bg-muted/40'"
              />
            </div>
          </button>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
