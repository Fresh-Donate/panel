export interface CustomerCurrencyStats {
  currency: string
  totalSpent: number
  purchaseCount: number
}

export interface Customer {
  id: string
  nickname: string
  email: string
  stats: CustomerCurrencyStats[]
  createdAt: string
  updatedAt: string
}

export type CustomerSortColumn = 'nickname' | 'email' | 'purchaseCount' | 'totalSpent' | 'createdAt'
