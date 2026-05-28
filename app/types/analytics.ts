export type Period = 'hourly' | 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
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

export interface StatsSummary {
  currency: string
  revenue: MetricSeries
  commission: MetricSeries
  customers: MetricSeries
  avgOrder: MetricSeries
  payments: MetricSeries
  paymentProviders: ProviderSummary[]
  topProducts: ProductSummary[]
}
