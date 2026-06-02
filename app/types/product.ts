export type ProductType = 'item' | 'privilege' | 'currency' | 'other'

export type Currency = 'RUB' | 'USD' | 'EUR'

export interface ProductPromotion {
  id: string
  name: string
  discountPercent: number
}

export interface ProductGroup {
  id: string
  name: string
  upgradeMode: boolean
}

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
  allowCustomCount: boolean
  forceDelivery: boolean
  activePromotions?: ProductPromotion[]
  discountPercent?: number
  discountedPrice?: number
  groups?: ProductGroup[]
  serverIds?: string[]
  createdAt: string
  updatedAt: string
}
