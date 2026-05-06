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
  testMode: boolean
  credentials: Record<string, string>
  // Default commission used as up-front estimate at checkout — overwritten by
  // real fee from the provider's webhook once the payment completes.
  commissionPercent: number
  commissionRule: CommissionRule
  supportedCurrencies: string[]
}
