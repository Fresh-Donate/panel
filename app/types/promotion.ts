export interface Promotion {
  id: string
  name: string
  discountPercent: number
  startsAt: string
  endsAt: string
  productIds: string[]
  createdAt: string
  updatedAt: string
}
