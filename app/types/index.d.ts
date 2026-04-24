export type ProductType = 'item' | 'privilege' | 'currency' | 'other'

export type Currency = 'RUB' | 'USD' | 'EUR'

export interface Product {
  id: string
  name: string
  price: number
  currency: Currency
  quantity: number
  description: string
  type: ProductType
  commands: string[]
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

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

export type CommissionMode = 'seller' | 'buyer' | 'split'

export interface CommissionRule {
  mode: CommissionMode
  customPercent?: number
}

export interface PaymentProvider {
  id: string
  providerId: string
  name: string
  description: string
  icon: string
  enabled: boolean
  /**
   * Per-provider "test mode" flag. When true, the provider talks to its
   * sandbox / staging environment. Providers that don't support a sandbox
   * simply ignore the flag.
   */
  testMode: boolean
  credentials: Record<string, string>
  /**
   * Default commission percent the provider charges. Used as an up-front
   * estimate at checkout time; the real fee from webhook data overwrites it
   * once the payment completes.
   */
  commissionPercent: number
  commissionRule: CommissionRule
  supportedCurrencies: string[]
}
