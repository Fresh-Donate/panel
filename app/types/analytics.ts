export type Period = 'hourly' | 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface MetricSeries {
  current: number
  previous: number
  sparkline: number[]
}

export interface ProviderSummary {
  providerId: string | null
  count: number
  amount: number
}

export interface ProductSummary {
  productId: string
  productName: string
  count: number
  amount: number
}

export interface ActivityBucket {
  count: number
  amount: number
}

export interface FunnelReason {
  reason: string
  count: number
}

export interface FunnelProvider {
  providerId: string | null
  attempts: number
  paid: number
  switched: number
  lost: number
}

export interface StatsFunnel {
  orders: number
  attempts: number
  paid: number
  paidFirstTry: number
  delivered: number
  awaitingPayment: number
  returnedLater: number
  leftAfterDecline: number
  left: number
  awaitingDelivery: number
  deliveryFailed: number
  refundedBeforeDelivery: number
  refunded: number
  declineReasons: FunnelReason[]
  providers: FunnelProvider[]
  medianSecondsToPay: number | null
  medianSecondsToDeliver: number | null
}

export interface StatsSummary {
  currency: string
  revenue: MetricSeries
  commission: MetricSeries
  customers: MetricSeries
  avgOrder: MetricSeries
  payments: MetricSeries
  paymentProviders: ProviderSummary[]
  topProducts: ProductSummary[]
  byHour: ActivityBucket[]
  // Monday first.
  byWeekday: ActivityBucket[]
}
