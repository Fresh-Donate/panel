<script setup lang="ts">
interface DeliveryLogResult {
  command: string
  response: string
  success: boolean
}

interface DeliveryLog {
  attempt: number
  timestamp: string
  success: boolean
  results?: DeliveryLogResult[]
  error?: string
}

interface PaymentItem {
  id: string
  customerNickname: string
  customerEmail: string
  productName: string
  productPrice: number
  productCurrency: string
  currency: string
  quantity: number
  totalAmount: number
  commissionPercent: number
  commissionAmount: number
  providerAmount: number
  status: string
  paymentOptionId: string | null
  providerId: string | null
  paidAt: string | null
  deliveredAt: string | null
  meta: {
    demo?: boolean
    deliveryLogs?: DeliveryLog[]
    previousDeliveryLogs?: DeliveryLog[]
    confirmationEmailSentAt?: string
  }
  externalPaymentUrl: string | null
  createdAt: string
  updatedAt: string
  userSelectedCount: number
}

const config = useRuntimeConfig()
const token = useCookie('auth_token')
const toast = useToast()

const fetching = ref(true)
const payments = ref<PaymentItem[]>([])
const total = ref(0)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = 20

const selected = ref<PaymentItem | null>(null)
const retrying = ref(false)
const resendingReceipt = ref(false)

const currencySymbols: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€'
}

const statusLabels: Record<string, { label: string, color: string }> = {
  pending: { label: 'Ожидает', color: 'warning' },
  paid: { label: 'Оплачен', color: 'info' },
  delivered: { label: 'Выполнен', color: 'success' },
  failed: { label: 'Ошибка', color: 'error' },
  refunded: { label: 'Возврат', color: 'neutral' },
  expired: { label: 'Истёк', color: 'neutral' }
}

const statuses = [
  { label: 'Все', value: '' },
  { label: 'Ожидает', value: 'pending' },
  { label: 'Оплачен', value: 'paid' },
  { label: 'Выполнен', value: 'delivered' },
  { label: 'Ошибка', value: 'failed' },
  { label: 'Возврат', value: 'refunded' },
  { label: 'Истёк', value: 'expired' }
]

async function fetchPayments() {
  fetching.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    if (statusFilter.value) params.set('status', statusFilter.value)
    params.set('limit', String(pageSize))
    params.set('offset', String((page.value - 1) * pageSize))

    const data = await $fetch<{ items: PaymentItem[], total: number }>(`/payments?${params}`, {
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    payments.value = data.items
    total.value = data.total
  } catch {
    toast.add({ title: 'Ошибка загрузки', description: 'Не удалось загрузить платежи.', color: 'error' })
  } finally {
    fetching.value = false
  }
}

onMounted(fetchPayments)
watch([search, statusFilter], () => {
  page.value = 1
  fetchPayments()
})
watch(page, fetchPayments)

const totalPages = computed(() => Math.ceil(total.value / pageSize))

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatDateFull(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function selectPayment(id: string) {
  // Fetch full detail
  $fetch<PaymentItem>(`/payments/${id}`, {
    baseURL: config.public.apiBase as string,
    headers: { Authorization: `Bearer ${token.value}` }
  }).then((data) => {
    selected.value = data
  })
}

async function retryDelivery() {
  if (!selected.value) return
  retrying.value = true
  try {
    selected.value = await $fetch<PaymentItem>(`/payments/${selected.value.id}/retry-delivery`, {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    toast.add({ title: 'Повторная выдача', description: 'Попытка выдачи запущена', color: 'success' })
    fetchPayments()
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось запустить выдачу', color: 'error' })
  } finally {
    retrying.value = false
  }
}

const deliveryLogs = computed<DeliveryLog[]>(() => selected.value?.meta?.deliveryLogs || [])
const previousLogs = computed<DeliveryLog[]>(() => selected.value?.meta?.previousDeliveryLogs || [])
const canRetry = computed(() => selected.value && ['paid', 'failed'].includes(selected.value.status))
const canResendReceipt = computed(() =>
  !!selected.value
  && !!selected.value.customerEmail
  && ['paid', 'delivered'].includes(selected.value.status)
  && !selected.value.meta?.demo
)

async function resendReceipt() {
  if (!selected.value) return
  resendingReceipt.value = true
  try {
    await $fetch<{ ok: boolean }>(`/payments/${selected.value.id}/resend-receipt`, {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    toast.add({ title: 'Чек отправлен повторно', description: selected.value.customerEmail, icon: 'i-lucide-mail-check', color: 'success' })
    selectPayment(selected.value.id)
  } catch (err: any) {
    const message = err?.data?.error || 'Не удалось отправить чек.'
    toast.add({ title: 'Ошибка', description: message, icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    resendingReceipt.value = false
  }
}

const columns = [
  { accessorKey: 'productName', header: 'Товар' },
  { accessorKey: 'customer', header: 'Покупатель' },
  { accessorKey: 'totalAmount', header: 'Сумма' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'createdAt', header: 'Дата' },
  { accessorKey: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel
    id="payments"
    grow
  >
    <template #header>
      <UDashboardNavbar title="Платежи">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <UInput
          v-model="search"
          placeholder="Поиск по нику, почте, товару..."
          icon="i-lucide-search"
          class="w-64"
        />
        <USelectMenu
          v-model="statusFilter"
          :items="statuses"
          value-key="value"
          placeholder="Статус"
          class="w-40"
        />
        <span class="text-sm text-muted ml-auto">Всего: {{ total }}</span>
      </div>

      <!-- Loading -->
      <div
        v-if="fetching"
        class="flex items-center justify-center py-12 h-[960px]"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <!-- Table -->
      <UTable
        v-else-if="payments.length > 0"
        :columns="columns"
        :data="payments"
        class="h-[960px]"
      >
        <template #productName-cell="{ row }">
          <span class="font-medium">{{ row.original.productName }}</span>
        </template>
        <template #customer-cell="{ row }">
          <div>
            <p class="font-medium">
              {{ row.original.customerNickname || '—' }}
            </p>
            <p class="text-xs text-muted">
              {{ row.original.customerEmail || '' }}
            </p>
          </div>
        </template>
        <template #totalAmount-cell="{ row }">
          <span class="font-semibold">
            {{
              Number(row.original.totalAmount).toLocaleString()
            }}{{ currencySymbols[row.original.currency] || row.original.currency }}
          </span>
        </template>
        <template #status-cell="{ row }">
          <UBadge
            :label="statusLabels[row.original.status]?.label || row.original.status"
            :color="(statusLabels[row.original.status]?.color as any) || 'neutral'"
            variant="subtle"
            size="sm"
          />
        </template>
        <template #createdAt-cell="{ row }">
          <span class="text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <UButton
            icon="i-lucide-eye"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="selectPayment(row.original.id)"
          />
        </template>
      </UTable>

      <!-- Empty -->
      <div
        v-else
        class="text-center py-16 h-[960px]"
      >
        <UIcon
          name="i-lucide-receipt"
          class="size-16 text-muted/20 mx-auto"
        />
        <p class="mt-4 text-muted">
          Платежей пока нет
        </p>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex justify-center mt-6"
      >
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="pageSize"
        />
      </div>
    </template>
  </UDashboardPanel>

  <!-- Detail panel -->
  <UDashboardPanel
    v-if="selected"
    id="payment-detail"
    collapsible
    class="max-w-md"
  >
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <span class="text-sm font-semibold">Детали платежа</span>
        </template>
        <template #trailing>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="selected = null"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-5">
        <!-- Status -->
        <div class="flex items-center justify-between">
          <UBadge
            :label="statusLabels[selected.status]?.label || selected.status"
            :color="(statusLabels[selected.status]?.color as any) || 'neutral'"
            variant="subtle"
            size="lg"
          />
          <UBadge
            v-if="selected.meta?.demo"
            label="Demo"
            color="warning"
            variant="outline"
            size="sm"
          />
        </div>

        <!-- Info -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-muted mb-0.5">
              Товар
            </p>
            <p class="text-sm font-medium">
              {{ selected.productName }}
            </p>
            <p class="text-xs text-muted">
              {{ Number(selected.productPrice).toLocaleString() }}{{ currencySymbols[selected.productCurrency] || selected.productCurrency }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Оплачено
            </p>
            <p class="text-sm font-semibold">
              {{
                Number(selected.totalAmount).toLocaleString()
              }}{{ currencySymbols[selected.currency] || selected.currency }}
            </p>
            <p
              v-if="selected.productCurrency !== selected.currency"
              class="text-[10px] text-muted"
            >
              товар: {{ Number(selected.productPrice).toLocaleString() }}{{ currencySymbols[selected.productCurrency] || selected.productCurrency }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Комиссия
            </p>
            <p class="text-sm">
              <span class="font-medium">{{ Number(selected.commissionAmount).toLocaleString() }}{{ currencySymbols[selected.currency] || selected.currency }}</span>
              <span class="text-muted ml-1">({{ selected.commissionPercent }}%)</span>
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Вы получите
            </p>
            <p class="text-sm font-semibold text-success">
              {{ Number(selected.providerAmount).toLocaleString() }}{{ currencySymbols[selected.currency] || selected.currency }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Покупатель
            </p>
            <p class="text-sm font-medium">
              {{ selected.customerNickname || '—' }}
            </p>
            <p class="text-xs text-muted">
              {{ selected.customerEmail || '' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Количество
            </p>
            <p class="text-sm">
              {{ selected.quantity * selected.userSelectedCount }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Создан
            </p>
            <p class="text-xs">
              {{ formatDateFull(selected.createdAt) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Оплачен
            </p>
            <p class="text-xs">
              {{ formatDateFull(selected.paidAt) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Выдан
            </p>
            <p class="text-xs">
              {{ formatDateFull(selected.deliveredAt) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              ID
            </p>
            <p class="text-[10px] font-mono text-muted break-all">
              {{ selected.id }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Платёжная система
            </p>
            <p class="text-xs">
              {{ selected.providerId }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Ссылка оплаты
            </p>
            <p class="text-[10px] font-mono text-muted truncate">
              {{ selected.externalPaymentUrl }}
            </p>
          </div>
        </div>

        <!-- Retry -->
        <UButton
          v-if="canRetry"
          icon="i-lucide-refresh-cw"
          label="Повторить выдачу"
          color="warning"
          variant="soft"
          block
          :loading="retrying"
          @click="retryDelivery"
        />

        <!-- Resend receipt -->
        <div
          v-if="selected.customerEmail"
          class="space-y-2"
        >
          <UButton
            icon="i-lucide-mail"
            :label="selected.meta?.confirmationEmailSentAt ? 'Отправить чек ещё раз' : 'Отправить чек'"
            color="primary"
            variant="soft"
            block
            :loading="resendingReceipt"
            :disabled="!canResendReceipt"
            @click="resendReceipt"
          />
          <p
            v-if="selected.meta?.confirmationEmailSentAt"
            class="text-[11px] text-muted text-center"
          >
            Чек отправлен {{ formatDateFull(selected.meta.confirmationEmailSentAt) }}
          </p>
        </div>

        <!-- Delivery logs -->
        <div v-if="deliveryLogs.length > 0">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
            <UIcon
              name="i-lucide-terminal"
              class="size-4"
            />
            Логи выдачи
          </h3>
          <div class="space-y-2">
            <div
              v-for="log in deliveryLogs"
              :key="log.attempt"
              class="rounded-lg border border-default p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium">Попытка {{ log.attempt }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-muted">{{ formatDateFull(log.timestamp) }}</span>
                  <UBadge
                    :label="log.success ? 'OK' : 'Ошибка'"
                    :color="log.success ? 'success' : 'error'"
                    variant="subtle"
                    size="xs"
                  />
                </div>
              </div>

              <div
                v-if="log.error"
                class="rounded bg-error-50 dark:bg-error-950/30 p-2"
              >
                <p class="text-xs font-mono text-error-600 dark:text-error-400">
                  {{ log.error }}
                </p>
              </div>

              <div
                v-if="log.results"
                class="space-y-1.5"
              >
                <div
                  v-for="(result, i) in log.results"
                  :key="i"
                  class="rounded bg-gray-50 dark:bg-gray-900 p-2"
                >
                  <div class="flex items-start gap-2">
                    <UIcon
                      :name="result.success ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                      :class="result.success ? 'text-success' : 'text-error'"
                      class="size-3.5 mt-0.5 shrink-0"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-mono font-medium">
                        {{ result.command }}
                      </p>
                      <p
                        v-if="result.response"
                        class="text-xs font-mono text-muted mt-0.5"
                      >
                        {{ result.response }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Previous logs -->
        <div v-if="previousLogs.length > 0">
          <UCollapsible>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              class="w-full justify-start"
              icon="i-lucide-history"
              label="Предыдущие попытки"
              trailing-icon="i-lucide-chevron-down"
            />
            <template #content>
              <div class="space-y-2 mt-2">
                <div
                  v-for="log in previousLogs"
                  :key="log.attempt"
                  class="rounded-lg border border-default p-3 opacity-60"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium">Попытка {{ log.attempt }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-muted">{{ formatDateFull(log.timestamp) }}</span>
                      <UBadge
                        :label="log.success ? 'OK' : 'Ошибка'"
                        :color="log.success ? 'success' : 'error'"
                        variant="subtle"
                        size="xs"
                      />
                    </div>
                  </div>
                  <div
                    v-if="log.error"
                    class="rounded bg-error-50 dark:bg-error-950/30 p-2"
                  >
                    <p class="text-xs font-mono text-error-600 dark:text-error-400">
                      {{ log.error }}
                    </p>
                  </div>
                  <div
                    v-if="log.results"
                    class="space-y-1.5"
                  >
                    <div
                      v-for="(result, i) in log.results"
                      :key="i"
                      class="rounded bg-gray-50 dark:bg-gray-900 p-2"
                    >
                      <div class="flex items-start gap-2">
                        <UIcon
                          :name="result.success ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                          :class="result.success ? 'text-success' : 'text-error'"
                          class="size-3.5 mt-0.5 shrink-0"
                        />
                        <div class="min-w-0 flex-1">
                          <p class="text-xs font-mono font-medium">
                            {{ result.command }}
                          </p>
                          <p
                            v-if="result.response"
                            class="text-xs font-mono text-muted mt-0.5"
                          >
                            {{
                              result.response
                            }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UCollapsible>
        </div>

        <!-- No logs -->
        <div
          v-if="deliveryLogs.length === 0 && previousLogs.length === 0 && selected.status !== 'pending'"
          class="text-center py-4"
        >
          <UIcon
            name="i-lucide-terminal"
            class="size-8 text-muted/20 mx-auto"
          />
          <p class="text-xs text-muted mt-2">
            Логов выдачи нет
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
