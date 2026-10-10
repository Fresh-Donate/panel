<script setup lang="ts">
import { PAYMENT_STATUSES } from '~/types'
import type { Payment } from '~/types'

const payment = defineModel<Payment>('payment', { required: true })

const emit = defineEmits<{
  close: []
  changed: []
}>()

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()

const forcing = ref(false)
const resendingReceipt = ref(false)

const status = computed(() => PAYMENT_STATUSES[payment.value.status])
const isPaid = computed(() => !!payment.value.paidAt && payment.value.status !== 'refunded')
const deliveryLogs = computed(() => payment.value.meta?.deliveryLogs || [])
const previousLogs = computed(() => payment.value.meta?.previousDeliveryLogs || [])
const canResendReceipt = computed(() =>
  !!payment.value.customerEmail
  && ['paid', 'delivered'].includes(payment.value.status)
  && !payment.value.meta?.demo
)

async function forceDelivery() {
  const confirmed = await confirm({
    title: 'Выдать принудительно?',
    description: isPaid.value
      ? 'Все команды выдачи выполнятся заново. Если игрок уже получил товар, он получит его ещё раз.'
      : 'Заказ не оплачен или по нему был возврат — товар будет выдан бесплатно. Все команды выдачи выполнятся заново.',
    confirmLabel: 'Выдать',
    color: 'warning'
  })
  if (!confirmed) return

  forcing.value = true
  try {
    payment.value = await api<Payment>(`/payments/${payment.value.id}/force-delivery`, { method: 'POST' })
    notify.success('Выдача запущена', 'Команды выполнятся на сервере, результат появится в логах')
    emit('changed')
  } catch (err) {
    notify.apiError(err, 'Не удалось запустить выдачу')
  } finally {
    forcing.value = false
  }
}

async function resendReceipt() {
  resendingReceipt.value = true
  try {
    await api(`/payments/${payment.value.id}/resend-receipt`, { method: 'POST' })
    notify.success('Чек отправлен повторно', payment.value.customerEmail, 'i-lucide-mail-check')
    payment.value = await api<Payment>(`/payments/${payment.value.id}`)
  } catch (err) {
    notify.apiError(err, 'Не удалось отправить чек.')
  } finally {
    resendingReceipt.value = false
  }
}
</script>

<template>
  <UDashboardPanel
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
            @click="emit('close')"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-5">
        <div class="flex items-center justify-between">
          <UBadge
            :label="status?.label || payment.status"
            :color="status?.color || 'neutral'"
            variant="subtle"
            size="lg"
          />
          <UBadge
            v-if="payment.meta?.demo"
            label="Demo"
            color="warning"
            variant="outline"
            size="sm"
          />
        </div>

        <div
          v-if="payment.itemsCount > 1 && payment.items?.length"
          class="rounded-lg border border-default p-3"
        >
          <p class="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <UIcon
              name="i-lucide-shopping-cart"
              class="size-3.5"
            />
            Состав заказа ({{ payment.itemsCount }})
          </p>
          <div class="space-y-1.5">
            <div
              v-for="item in payment.items"
              :key="item.id"
              class="flex items-center justify-between gap-2 text-xs"
            >
              <span class="truncate">
                {{ item.productName }}
                <span class="text-muted">× {{ item.userSelectedCount }}</span>
              </span>
              <span class="font-medium tabular-nums whitespace-nowrap">
                {{ formatMoney(item.lineTotal, item.productCurrency) }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-muted mb-0.5">
              {{ payment.itemsCount > 1 ? 'Заказ' : 'Товар' }}
            </p>
            <p class="text-sm font-medium">
              {{ payment.itemsCount > 1 ? `Заказ из ${payment.itemsCount} товаров` : payment.productName }}
            </p>
            <p class="text-xs text-muted">
              {{ formatMoney(payment.productPrice, payment.productCurrency) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Оплачено
            </p>
            <p class="text-sm font-semibold">
              {{ formatMoney(payment.totalAmount, payment.currency) }}
            </p>
            <p
              v-if="payment.productCurrency !== payment.currency"
              class="text-[10px] text-muted"
            >
              товар: {{ formatMoney(payment.productPrice, payment.productCurrency) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Комиссия
            </p>
            <p class="text-sm">
              <span class="font-medium">{{ formatMoney(payment.commissionAmount, payment.currency) }}</span>
              <span class="text-muted ml-1">({{ payment.commissionPercent }}%)</span>
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Вы получите
            </p>
            <p class="text-sm font-semibold text-success">
              {{ formatMoney(payment.providerAmount, payment.currency) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Покупатель
            </p>
            <p class="text-sm font-medium">
              {{ payment.customerNickname || '-' }}
            </p>
            <p class="text-xs text-muted">
              {{ payment.customerEmail || '' }}
            </p>
          </div>
          <div v-if="payment.itemsCount <= 1">
            <p class="text-xs text-muted mb-0.5">
              Количество
            </p>
            <p class="text-sm">
              {{ payment.quantity * payment.userSelectedCount }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Создан
            </p>
            <p class="text-xs">
              {{ formatDateTime(payment.createdAt, { seconds: true }) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Оплачен
            </p>
            <p class="text-xs">
              {{ formatDateTime(payment.paidAt, { seconds: true }) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Выдан
            </p>
            <p class="text-xs">
              {{ formatDateTime(payment.deliveredAt, { seconds: true }) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              ID
            </p>
            <p class="text-[10px] font-mono text-muted break-all">
              {{ payment.id }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Платёжная система
            </p>
            <p class="text-xs">
              {{ payment.providerId }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">
              Ссылка оплаты
            </p>
            <p class="text-[10px] font-mono text-muted truncate">
              {{ payment.externalPaymentUrl }}
            </p>
          </div>
        </div>

        <UButton
          icon="i-lucide-send"
          label="Выдать принудительно"
          color="warning"
          variant="soft"
          block
          :loading="forcing"
          @click="forceDelivery"
        />

        <div
          v-if="payment.customerEmail"
          class="space-y-2"
        >
          <UButton
            icon="i-lucide-mail"
            :label="payment.meta?.confirmationEmailSentAt ? 'Отправить чек ещё раз' : 'Отправить чек'"
            color="primary"
            variant="soft"
            block
            :loading="resendingReceipt"
            :disabled="!canResendReceipt"
            @click="resendReceipt"
          />
          <p
            v-if="payment.meta?.confirmationEmailSentAt"
            class="text-[11px] text-muted text-center"
          >
            Чек отправлен {{ formatDateTime(payment.meta.confirmationEmailSentAt, { seconds: true }) }}
          </p>
        </div>

        <div v-if="deliveryLogs.length > 0">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
            <UIcon
              name="i-lucide-terminal"
              class="size-4"
            />
            Логи выдачи
          </h3>
          <PaymentsDeliveryLogList :logs="deliveryLogs" />
        </div>

        <UCollapsible v-if="previousLogs.length > 0">
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
            <PaymentsDeliveryLogList
              :logs="previousLogs"
              faded
              class="mt-2"
            />
          </template>
        </UCollapsible>

        <div
          v-if="deliveryLogs.length === 0 && previousLogs.length === 0 && payment.status !== 'pending'"
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
