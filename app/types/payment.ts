export type PaymentStatus = 'pending' | 'paid' | 'delivered' | 'failed' | 'refunded' | 'expired'

export const PAYMENT_STATUSES: Record<PaymentStatus, { label: string, color: 'warning' | 'info' | 'success' | 'error' | 'neutral' }> = {
  pending: { label: 'Ожидает', color: 'warning' },
  paid: { label: 'Оплачен', color: 'info' },
  delivered: { label: 'Выполнен', color: 'success' },
  failed: { label: 'Ошибка', color: 'error' },
  refunded: { label: 'Возврат', color: 'neutral' },
  expired: { label: 'Истёк', color: 'neutral' }
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
