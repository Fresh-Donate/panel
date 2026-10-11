export type PaymentStatus = 'pending' | 'paid' | 'delivered' | 'failed' | 'refunded' | 'expired'

export const PAYMENT_STATUSES: Record<PaymentStatus, { label: string, color: 'warning' | 'info' | 'success' | 'error' | 'neutral' }> = {
  pending: { label: 'Ожидает', color: 'warning' },
  paid: { label: 'Оплачен', color: 'info' },
  delivered: { label: 'Выполнен', color: 'success' },
  failed: { label: 'Ошибка', color: 'error' },
  refunded: { label: 'Возврат', color: 'neutral' },
  expired: { label: 'Истёк', color: 'neutral' }
}

export const DECLINE_REASONS: Record<string, string> = {
  'unknown': 'Причина не указана',
  'declined': 'Отклонён',
  'provider_error': 'Провайдер не создал платёж',
  'cancel': 'Отменён',
  'fail': 'Ошибка оплаты',
  'system_fail': 'Сбой провайдера',
  'insufficient_funds': 'Недостаточно средств',
  'general_decline': 'Отказ банка',
  'call_issuer': 'Отказ банка-эмитента',
  '3d_secure_failed': 'Не пройден 3-D Secure',
  'card_expired': 'Карта просрочена',
  'invalid_card_number': 'Неверный номер карты',
  'invalid_csc': 'Неверный CVC',
  'fraud_suspected': 'Подозрение на мошенничество',
  'expired_on_confirmation': 'Не подтверждён вовремя',
  'expired_on_capture': 'Не списан вовремя',
  'canceled_by_merchant': 'Отменён магазином',
  'payment_method_limit_exceeded': 'Превышен лимит',
  'payment_method_restricted': 'Способ оплаты ограничен',
  'country_forbidden': 'Страна не поддерживается',
  'issuer_unavailable': 'Банк недоступен',
  'internal_timeout': 'Таймаут провайдера',
  'permission_revoked': 'Разрешение отозвано',
  'identification_required': 'Нужна идентификация',
  'unsupported_mobile_operator': 'Оператор не поддерживается'
}

export interface DeliveryLogResult {
  command: string
  response: string
  success: boolean
}

export interface DeliveryLog {
  attempt: number
  timestamp: string
  success: boolean
  serverId?: string
  results?: DeliveryLogResult[]
  error?: string
}

export interface PaymentLineItem {
  id: string
  productName: string
  productPrice: number
  productCurrency: string
  quantity: number
  userSelectedCount: number
  lineTotal: number
  discountPercent: number
  upgradeDiscount: number
}

export interface Payment {
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
  status: PaymentStatus
  paymentOptionId: string | null
  providerId: string | null
  paidAt: string | null
  deliveredAt: string | null
  meta: {
    demo?: boolean
    deliveryLogs?: DeliveryLog[]
    previousDeliveryLogs?: DeliveryLog[]
    confirmationEmailSentAt?: string
    cancelReason?: string
    providerError?: string
    wata?: { errorDescription?: string }
    tebex?: { declineMessage?: string }
  }
  externalPaymentUrl: string | null
  createdAt: string
  updatedAt: string
  userSelectedCount: number
  itemsCount: number
  items?: PaymentLineItem[]
}

export interface RecentPayment {
  id: string
  customerNickname?: string
  customerEmail?: string
  productName: string
  totalAmount: number
  currency: string
  status: PaymentStatus
  createdAt: string
}

export interface Paginated<T> {
  items: T[]
  total: number
}
