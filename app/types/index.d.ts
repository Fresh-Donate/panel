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

export interface PaymentMethod {
  id: string
  name: string
  commission: number
  enabled: boolean
}

export type CommissionMode = 'seller' | 'buyer' | 'split'

export interface CommissionRule {
  mode: CommissionMode
  customPercent?: number
}

export interface PaymentProvider {
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
