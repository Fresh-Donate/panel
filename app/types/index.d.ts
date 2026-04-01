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
