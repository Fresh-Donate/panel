<script setup lang="ts">
import { z } from 'zod'

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

const schema = z.object({
  demo_payments: z.boolean(),
  telemetry_enabled: z.boolean()
})

type DeliveryMethod = 'rcon' | 'plugin'
type SupportedCurrency = 'RUB' | 'USD' | 'EUR'

const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['RUB', 'USD', 'EUR']

// Mirror of backend `defaultRatesFor` — small constant, kept duplicated
// instead of fetched so the form can re-seed instantly when the admin
// switches the base, without a round trip.
const DEFAULT_RATES_BY_BASE: Record<SupportedCurrency, Record<string, number>> = {
  RUB: { USD: 95, EUR: 100 },
  USD: { RUB: 0.0105, EUR: 1.05 },
  EUR: { RUB: 0.01, USD: 0.95 }
}

interface SmtpConfig {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  fromEmail: string
  fromName: string
}

interface ReceiptTemplate {
  subject: string
  html: string
}

interface SettingsData {
  demo_payments: boolean
  delivery_method: DeliveryMethod
  rcon_config: { host: string, port: number, password: string }
  plugin_config: { token: string }
  base_currency: SupportedCurrency
  currency_rates: Record<string, number>
  telemetry_enabled: boolean
  installation_id: string
  smtp_config: SmtpConfig
  receipt_template: ReceiptTemplate
}

const state = reactive({
  demo_payments: false,
  telemetry_enabled: true
})

const installationId = ref('')

const baseCurrency = ref<SupportedCurrency>('RUB')
const rates = ref<Record<string, number>>({ ...DEFAULT_RATES_BY_BASE.RUB })
const ratesLoading = ref(false)

const baseCurrencyItems = SUPPORTED_CURRENCIES.map(c => ({ label: c, value: c }))

const rateCurrencies = computed(() => SUPPORTED_CURRENCIES.filter(c => c !== baseCurrency.value))

function setBaseCurrency(newBase: SupportedCurrency) {
  if (newBase === baseCurrency.value) return
  baseCurrency.value = newBase
  // Stored rates were "X per old base" — meaningless under the new base.
  // Reseed from defaults so the form never carries forward broken numbers.
  rates.value = { ...DEFAULT_RATES_BY_BASE[newBase] }
}

const deliveryMethod = ref<DeliveryMethod>('rcon')
const savedDeliveryMethod = ref<DeliveryMethod>('rcon')
const pendingDeliverySwitch = ref<DeliveryMethod | null>(null)
const showSwitchWarning = ref(false)

const rconState = reactive({
  host: '',
  port: 25575,
  password: ''
})

const pluginState = reactive({
  token: ''
})

const loading = ref(false)
const deliveryLoading = ref(false)
const fetching = ref(true)

const smtpState = reactive<SmtpConfig>({
  enabled: false,
  host: '',
  port: 465,
  secure: true,
  user: '',
  password: '',
  fromEmail: '',
  fromName: ''
})
const smtpLoading = ref(false)
const smtpTestLoading = ref(false)
const smtpTestEmail = ref('')

const receiptState = reactive<ReceiptTemplate>({
  subject: '',
  html: ''
})
const receiptLoading = ref(false)
const receiptPreviewOpen = ref(false)
const receiptPreviewHtml = ref('')
const receiptPreviewSubject = ref('')
const receiptPreviewLoading = ref(false)

interface PlaceholderItem { key: string, description: string }
const placeholders = ref<PlaceholderItem[]>([])

const smtpPortPresets = [
  { label: '465 (SSL)', value: 465 },
  { label: '587 (STARTTLS)', value: 587 },
  { label: '25', value: 25 },
  { label: '2525', value: 2525 }
]

async function fetchSettings() {
  fetching.value = true
  try {
    const data = await $fetch<SettingsData>('/settings', {
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    state.demo_payments = data.demo_payments
    state.telemetry_enabled = data.telemetry_enabled
    installationId.value = data.installation_id || ''
    deliveryMethod.value = data.delivery_method
    savedDeliveryMethod.value = data.delivery_method
    rconState.host = data.rcon_config?.host || ''
    rconState.port = data.rcon_config?.port || 25575
    rconState.password = data.rcon_config?.password || ''
    pluginState.token = data.plugin_config?.token || ''
    baseCurrency.value = data.base_currency || 'RUB'
    rates.value = { ...data.currency_rates }
    Object.assign(smtpState, data.smtp_config)
    receiptState.subject = data.receipt_template?.subject || ''
    receiptState.html = data.receipt_template?.html || ''
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

async function fetchPlaceholders() {
  try {
    const data = await $fetch<{ placeholders: PlaceholderItem[] }>('/settings/receipt/placeholders', {
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    placeholders.value = data.placeholders
  } catch {
    // Silent — placeholder reference is a nice-to-have, not critical.
  }
}

onMounted(() => {
  fetchSettings()
  fetchPlaceholders()
})

async function onSubmitGeneral() {
  loading.value = true
  try {
    const data = await $fetch<SettingsData>('/settings', {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        demo_payments: state.demo_payments,
        telemetry_enabled: state.telemetry_enabled
      }
    })
    state.demo_payments = data.demo_payments
    state.telemetry_enabled = data.telemetry_enabled
    toast.add({ title: 'Настройки сохранены', icon: 'i-lucide-check-circle', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось сохранить.', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    loading.value = false
  }
}

function requestDeliverySwitch(method: DeliveryMethod) {
  if (method === deliveryMethod.value) return
  if (savedDeliveryMethod.value !== 'rcon' && savedDeliveryMethod.value !== 'plugin') {
    // First time — no warning needed
    deliveryMethod.value = method
    return
  }
  pendingDeliverySwitch.value = method
  showSwitchWarning.value = true
}

function confirmSwitch() {
  if (pendingDeliverySwitch.value) {
    deliveryMethod.value = pendingDeliverySwitch.value
  }
  showSwitchWarning.value = false
  pendingDeliverySwitch.value = null
}

function cancelSwitch() {
  showSwitchWarning.value = false
  pendingDeliverySwitch.value = null
}

async function saveDelivery() {
  deliveryLoading.value = true
  try {
    const body: Record<string, any> = {
      delivery_method: deliveryMethod.value
    }
    if (deliveryMethod.value === 'rcon') {
      body.rcon_config = { host: rconState.host, port: rconState.port, password: rconState.password }
    } else {
      body.plugin_config = { token: pluginState.token }
    }
    const data = await $fetch<SettingsData>('/settings', {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body
    })
    savedDeliveryMethod.value = data.delivery_method
    deliveryMethod.value = data.delivery_method
    rconState.host = data.rcon_config?.host || ''
    rconState.port = data.rcon_config?.port || 25575
    rconState.password = data.rcon_config?.password || ''
    pluginState.token = data.plugin_config?.token || ''
    toast.add({ title: 'Настройки выдачи сохранены', icon: 'i-lucide-check-circle', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось сохранить настройки выдачи.', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    deliveryLoading.value = false
  }
}

async function onSubmitCurrency() {
  ratesLoading.value = true
  try {
    const payload: Record<string, number> = {}
    for (const code of rateCurrencies.value) {
      const rate = Number(rates.value[code])
      if (Number.isFinite(rate) && rate > 0) payload[code] = rate
    }
    const data = await $fetch<SettingsData>('/settings', {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        base_currency: baseCurrency.value,
        currency_rates: payload
      }
    })
    baseCurrency.value = data.base_currency
    rates.value = { ...data.currency_rates }
    toast.add({ title: 'Настройки валют сохранены', icon: 'i-lucide-check-circle', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось сохранить настройки валют.', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    ratesLoading.value = false
  }
}

function regenerateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  pluginState.token = result
}

async function saveSmtp() {
  smtpLoading.value = true
  try {
    const data = await $fetch<SettingsData>('/settings', {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { smtp_config: { ...smtpState } }
    })
    Object.assign(smtpState, data.smtp_config)
    toast.add({ title: 'SMTP-настройки сохранены', icon: 'i-lucide-check-circle', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось сохранить настройки SMTP.', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    smtpLoading.value = false
  }
}

async function sendTestEmail() {
  if (!smtpTestEmail.value) {
    toast.add({ title: 'Укажите адрес', description: 'Введите email для тестового письма.', color: 'warning' })
    return
  }
  smtpTestLoading.value = true
  try {
    await $fetch<{ ok: boolean }>('/settings/smtp/test', {
      baseURL: config.public.apiBase as string,
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { to: smtpTestEmail.value }
    })
    toast.add({ title: 'Тестовое письмо отправлено', description: `Проверьте ${smtpTestEmail.value}.`, icon: 'i-lucide-check-circle', color: 'success' })
  } catch (err: any) {
    const message = err?.data?.error || 'Не удалось отправить.'
    toast.add({ title: 'Ошибка SMTP', description: message, icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    smtpTestLoading.value = false
  }
}

async function saveReceiptTemplate() {
  receiptLoading.value = true
  try {
    const data = await $fetch<SettingsData>('/settings', {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { receipt_template: { subject: receiptState.subject, html: receiptState.html } }
    })
    receiptState.subject = data.receipt_template.subject
    receiptState.html = data.receipt_template.html
    toast.add({ title: 'Шаблон чека сохранён', icon: 'i-lucide-check-circle', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось сохранить шаблон.', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    receiptLoading.value = false
  }
}

async function openReceiptPreview() {
  receiptPreviewLoading.value = true
  receiptPreviewOpen.value = true
  try {
    const data = await $fetch<{ subject: string, html: string }>('/settings/receipt/preview', {
      baseURL: config.public.apiBase as string,
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { template: { subject: receiptState.subject, html: receiptState.html } }
    })
    receiptPreviewSubject.value = data.subject
    receiptPreviewHtml.value = data.html
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось построить превью.', color: 'error' })
    receiptPreviewOpen.value = false
  } finally {
    receiptPreviewLoading.value = false
  }
}

async function copyPlaceholder(key: string) {
  const placeholder = `{${key}}`
  try {
    await navigator.clipboard.writeText(placeholder)
    toast.add({ title: 'Скопировано', description: placeholder, icon: 'i-lucide-clipboard-check', color: 'success' })
  } catch {
    toast.add({ title: 'Не удалось скопировать', color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="settings">
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

      <div
        v-else
        class="space-y-6"
      >
        <!-- General -->
        <UPageCard
          title="Общие настройки"
          description="Ключевые настройки магазина и панели."
        >
          <UForm
            :schema="schema"
            :state="state"
            class="space-y-6"
            @submit="onSubmitGeneral"
          >
            <UFormField
              label="Режим демо-платежей"
              name="demo_payments"
              description="Платежи из магазина будут автоматически приниматься и не будут взимать плату."
            >
              <USwitch v-model="state.demo_payments" />
            </UFormField>

            <USeparator />

            <UFormField
              label="Анонимная телеметрия"
              name="telemetry_enabled"
              description="Отправлять анонимные данные об инсталляции (версия, ОС, включённые шлюзы, способ выдачи) в FreshDonate. Помогает понимать, какие версии и конфигурации используются. Не содержит ников, email, ключей и сумм."
            >
              <USwitch v-model="state.telemetry_enabled" />
            </UFormField>

            <div
              v-if="installationId"
              class="text-xs text-muted font-mono"
            >
              Installation ID: {{ installationId }}
            </div>

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

        <!-- Currency -->
        <UPageCard
          title="Валюты"
          description="Базовая валюта и курсы конвертации. Используются для пересчёта статистики и сортировок (например, по сумме покупок)."
        >
          <div class="space-y-6">
            <UFormField
              label="Базовая валюта"
              description="К ней приводятся все суммы при вычислениях. При смене валюты курсы будут пересозданы со значениями по умолчанию."
            >
              <USelectMenu
                :model-value="baseCurrency"
                :items="baseCurrencyItems"
                value-key="value"
                class="w-full max-w-xs"
                @update:model-value="setBaseCurrency"
              />
            </UFormField>

            <USeparator />

            <UFormField
              label="Курсы валют"
              :description="`Сколько ${baseCurrency} в одной единице валюты.`"
            >
              <div class="space-y-2 max-w-lg">
                <div
                  v-for="code in rateCurrencies"
                  :key="code"
                  class="flex items-center gap-3"
                >
                  <span class="w-16 font-mono text-sm">1 {{ code }}</span>
                  <span class="text-muted text-sm">=</span>
                  <UInput
                    v-model.number="rates[code]"
                    type="number"
                    step="0.0001"
                    min="0"
                    class="flex-1"
                  />
                  <span class="w-12 font-mono text-muted text-sm">{{ baseCurrency }}</span>
                </div>
              </div>
            </UFormField>

            <USeparator />

            <div>
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                :loading="ratesLoading"
                @click="onSubmitCurrency"
              />
            </div>
          </div>
        </UPageCard>

        <!-- Delivery -->
        <UPageCard
          title="Выдача товаров"
          description="Выберите способ выдачи товаров игрокам после оплаты."
        >
          <!-- Method selector -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              class="relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer text-left"
              :class="deliveryMethod === 'rcon'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-default bg-elevated hover:border-muted'"
              @click="requestDeliverySwitch('rcon')"
            >
              <UBadge
                v-if="savedDeliveryMethod === 'rcon'"
                label="Активен"
                color="success"
                variant="subtle"
                size="xs"
                class="absolute top-3 right-3"
              />
              <div
                class="size-12 rounded-xl flex items-center justify-center shrink-0"
                :class="deliveryMethod === 'rcon' ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'"
              >
                <UIcon
                  name="i-lucide-terminal"
                  class="size-6"
                />
              </div>
              <div>
                <p class="font-semibold">
                  RCON
                </p>
                <p class="text-xs text-muted mt-0.5">
                  Подключение к серверу через RCON протокол для выполнения команд
                </p>
              </div>
            </button>

            <button
              type="button"
              class="relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer text-left"
              :class="deliveryMethod === 'plugin'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-default bg-elevated hover:border-muted'"
              @click="requestDeliverySwitch('plugin')"
            >
              <UBadge
                v-if="savedDeliveryMethod === 'plugin'"
                label="Активен"
                color="success"
                variant="subtle"
                size="xs"
                class="absolute top-3 right-3"
              />
              <div
                class="size-12 rounded-xl flex items-center justify-center shrink-0"
                :class="deliveryMethod === 'plugin' ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'"
              >
                <UIcon
                  name="i-lucide-puzzle"
                  class="size-6"
                />
              </div>
              <div>
                <p class="font-semibold">
                  Плагин
                </p>
                <p class="text-xs text-muted mt-0.5">
                  Установите плагин на сервер для автоматической выдачи
                </p>
              </div>
            </button>
          </div>

          <!-- RCON settings -->
          <div
            v-if="deliveryMethod === 'rcon'"
            class="space-y-4"
          >
            <div class="flex gap-3 p-3 rounded-lg bg-info/10 border border-info/20 mb-4">
              <UIcon
                name="i-lucide-info"
                class="size-5 text-info shrink-0 mt-0.5"
              />
              <p class="text-xs text-muted">
                Убедитесь, что RCON включён в <span class="font-mono">server.properties</span>: <span class="font-mono">enable-rcon=true</span>, <span class="font-mono">rcon.port=25575</span>, <span class="font-mono">rcon.password=your_password</span>.
              </p>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <UFormField
                label="Хост"
                class="col-span-2"
              >
                <UInput
                  v-model="rconState.host"
                  placeholder="127.0.0.1 или адрес сервера"
                  icon="i-lucide-server"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Порт">
                <UInput
                  v-model.number="rconState.port"
                  type="number"
                  placeholder="25575"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Пароль RCON">
              <UInput
                v-model="rconState.password"
                type="password"
                placeholder="Пароль из server.properties"
                icon="i-lucide-lock"
                class="w-full max-w-lg"
              />
            </UFormField>

            <USeparator />

            <div>
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                :loading="deliveryLoading"
                @click="saveDelivery"
              />
            </div>
          </div>

          <!-- Plugin settings -->
          <div
            v-if="deliveryMethod === 'plugin'"
            class="space-y-4"
          >
            <div class="flex gap-3 p-3 rounded-lg bg-info/10 border border-info/20">
              <UIcon
                name="i-lucide-info"
                class="size-5 text-info shrink-0 mt-0.5"
              />
              <p class="text-xs text-muted">
                Скачайте плагин и поместите его в папку <span class="font-mono">plugins/</span> вашего сервера. Плагин автоматически подключится к FreshDonate и будет выдавать товары.
              </p>
            </div>

            <div class="flex items-center gap-4 p-5 rounded-xl border border-default bg-elevated">
              <div class="size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <UIcon
                  name="i-lucide-puzzle"
                  class="size-7 text-primary"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold">
                  FreshDonate Plugin
                </p>
                <p class="text-sm text-muted mt-0.5">
                  Для Spigot / Paper 1.13.2+
                </p>
              </div>
              <NuxtLink
                to="https://github.com/Fresh-Donate/plugin/releases/latest"
                target="_blank"
              >
                <UButton
                  label="Скачать .jar"
                  icon="i-lucide-download"
                  variant="soft"
                  class="cursor-pointer"
                />
              </NuxtLink>
            </div>

            <UFormField
              label="Токен плагина"
              description="Используется для авторизации плагина. Укажите этот токен в config.yml плагина."
            >
              <div class="flex gap-2 max-w-lg">
                <UInput
                  v-model="pluginState.token"
                  readonly
                  class="w-full font-mono text-sm"
                />
                <UButton
                  icon="i-lucide-refresh-cw"
                  variant="soft"
                  color="neutral"
                  square
                  @click="regenerateToken"
                />
              </div>
            </UFormField>

            <div class="p-4 rounded-lg bg-muted/5 border border-default">
              <p class="text-sm font-medium mb-2">
                Установка:
              </p>
              <ol class="text-xs text-muted space-y-1.5 list-decimal list-inside">
                <li>Скачайте <span class="font-mono">FreshDonate.jar</span></li>
                <li>Поместите файл в папку <span class="font-mono">plugins/</span> сервера</li>
                <li>Перезапустите сервер</li>
                <li>В файле <span class="font-mono">plugins/FreshDonate/config.yml</span> укажите токен выше</li>
              </ol>
            </div>

            <USeparator />

            <div>
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                :loading="deliveryLoading"
                @click="saveDelivery"
              />
            </div>
          </div>
        </UPageCard>

        <!-- SMTP -->
        <UPageCard
          title="Отправка писем (SMTP)"
          description="Подтверждения покупок отправляются покупателям на email. Подключите свой почтовый ящик (Яндекс, Mail.ru, Timeweb и т.п.) — настройки SMTP подскажет ваш провайдер."
        >
          <div class="space-y-4">
            <UFormField
              label="Включить отправку"
              name="smtp_enabled"
              description="Если выключено, чеки не отправляются ни автоматически, ни вручную."
            >
              <USwitch v-model="smtpState.enabled" />
            </UFormField>

            <USeparator />

            <div class="grid grid-cols-3 gap-3">
              <UFormField
                label="SMTP-хост"
                class="col-span-2"
              >
                <UInput
                  v-model="smtpState.host"
                  placeholder="smtp.timeweb.ru"
                  icon="i-lucide-server"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Порт">
                <UInput
                  v-model.number="smtpState.port"
                  type="number"
                  placeholder="465"
                  class="w-full"
                />
                <template #help>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <button
                      v-for="preset in smtpPortPresets"
                      :key="preset.value"
                      type="button"
                      class="text-[10px] px-1.5 py-0.5 rounded bg-elevated hover:bg-muted/20 text-muted cursor-pointer"
                      @click="smtpState.port = preset.value; smtpState.secure = preset.value === 465"
                    >
                      {{ preset.label }}
                    </button>
                  </div>
                </template>
              </UFormField>
            </div>

            <UFormField
              label="Защищённое соединение (SSL/TLS)"
              description="Включено для порта 465. Для 587 (STARTTLS) — выключено."
            >
              <USwitch v-model="smtpState.secure" />
            </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Логин (обычно полный email)">
                <UInput
                  v-model="smtpState.user"
                  placeholder="no-reply@origon.pro"
                  icon="i-lucide-user"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Пароль">
                <UInput
                  v-model="smtpState.password"
                  type="password"
                  placeholder="••••••••"
                  icon="i-lucide-lock"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField
                label="Email отправителя"
                description="С какого адреса покупатель увидит письмо."
              >
                <UInput
                  v-model="smtpState.fromEmail"
                  placeholder="no-reply@origon.pro"
                  icon="i-lucide-mail"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Имя отправителя"
                description="Отображаемое имя рядом с адресом."
              >
                <UInput
                  v-model="smtpState.fromName"
                  placeholder="FreshDonate Shop"
                  class="w-full"
                />
              </UFormField>
            </div>

            <USeparator />

            <div class="flex items-end gap-3 flex-wrap">
              <UFormField
                label="Отправить тестовое письмо на"
                class="flex-1 min-w-[240px]"
              >
                <UInput
                  v-model="smtpTestEmail"
                  type="email"
                  placeholder="test@example.com"
                  icon="i-lucide-send"
                  class="w-full"
                />
              </UFormField>
              <UButton
                label="Тест"
                icon="i-lucide-send"
                variant="soft"
                :loading="smtpTestLoading"
                :disabled="!smtpState.host"
                @click="sendTestEmail"
              />
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                :loading="smtpLoading"
                @click="saveSmtp"
              />
            </div>

            <div class="flex gap-3 p-3 rounded-lg bg-info/10 border border-info/20">
              <UIcon
                name="i-lucide-info"
                class="size-5 text-info shrink-0 mt-0.5"
              />
              <p class="text-xs text-muted">
                Тестовое письмо будет отправлено с текущим (несохранённым) шаблоном чека.
                Если письмо ушло в спам — проверьте DNS-записи SPF и DKIM у своего домена.
              </p>
            </div>
          </div>
        </UPageCard>

        <!-- Receipt template -->
        <UPageCard
          title="Оформление чека"
          description="HTML-шаблон письма-подтверждения. Используйте плейсхолдеры {имя} для подстановки данных заказа."
        >
          <div class="space-y-4">
            <UFormField
              label="Тема письма"
            >
              <UInput
                v-model="receiptState.subject"
                placeholder="Чек о покупке — {productName}"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="HTML письма"
              :description="`Поддерживаются inline-стили (style=&quot;...&quot;) и таблицы. ${receiptState.html.length} / 100000 символов.`"
            >
              <UTextarea
                v-model="receiptState.html"
                :rows="18"
                placeholder="<html>...</html>"
                class="w-full font-mono text-xs"
              />
            </UFormField>

            <div>
              <p class="text-sm font-medium mb-2">
                Доступные плейсхолдеры
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="ph in placeholders"
                  :key="ph.key"
                  type="button"
                  :title="ph.description"
                  class="text-xs px-2 py-1 rounded-md bg-elevated hover:bg-primary/10 hover:text-primary border border-default font-mono cursor-pointer transition-colors"
                  @click="copyPlaceholder(ph.key)"
                >
                  {{ '{' + ph.key + '}' }}
                </button>
              </div>
              <p class="text-xs text-muted mt-2">
                Кликните по плейсхолдеру, чтобы скопировать. Наведите курсор — увидите подсказку.
              </p>
            </div>

            <USeparator />

            <div class="flex gap-3">
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                :loading="receiptLoading"
                @click="saveReceiptTemplate"
              />
              <UButton
                label="Предпросмотр"
                icon="i-lucide-eye"
                variant="soft"
                color="neutral"
                @click="openReceiptPreview"
              />
            </div>
          </div>
        </UPageCard>
      </div>

      <!-- Receipt preview modal -->
      <UModal v-model:open="receiptPreviewOpen">
        <template #content>
          <div class="p-4 space-y-3 max-h-[85vh] overflow-hidden flex flex-col">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-bold">
                Предпросмотр чека
              </h3>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="neutral"
                square
                @click="receiptPreviewOpen = false"
              />
            </div>
            <div class="text-xs text-muted">
              <span class="font-medium text-default">Тема:</span> {{ receiptPreviewSubject }}
            </div>
            <div
              v-if="receiptPreviewLoading"
              class="flex items-center justify-center py-10"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="size-6 animate-spin text-muted"
              />
            </div>
            <iframe
              v-else
              :srcdoc="receiptPreviewHtml"
              class="flex-1 w-full min-h-[60vh] border border-default rounded-md bg-white"
              sandbox=""
            />
          </div>
        </template>
      </UModal>

      <!-- Switch warning modal -->
      <UModal v-model:open="showSwitchWarning">
        <template #content>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <UIcon
                  name="i-lucide-triangle-alert"
                  class="size-5 text-warning"
                />
              </div>
              <div>
                <h3 class="font-bold">
                  Сменить способ выдачи?
                </h3>
                <p class="text-sm text-muted mt-0.5">
                  Текущий способ выдачи будет заменён. Убедитесь, что новый метод настроен корректно, иначе товары не будут выдаваться.
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-3">
              <UButton
                label="Отмена"
                variant="ghost"
                color="neutral"
                @click="cancelSwitch"
              />
              <UButton
                label="Сменить"
                color="warning"
                @click="confirmSwitch"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
