import type { Group } from './group'

export type ProductType = 'item' | 'privilege' | 'currency' | 'other'

export const PRODUCT_TYPES: { value: ProductType, label: string, icon: string }[] = [
  { value: 'item', label: 'Предмет', icon: 'i-lucide-box' },
  { value: 'privilege', label: 'Привилегия', icon: 'i-lucide-crown' },
  { value: 'currency', label: 'Валюта', icon: 'i-lucide-coins' },
  { value: 'other', label: 'Другое', icon: 'i-lucide-package' }
]

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

export interface ProductServer {
  id: string
  name: string
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
  servers?: ProductServer[]
  createdAt: string
  updatedAt: string
}

export interface ProductSection {
  key: string
  group: Group | null
  products: Product[]
}
