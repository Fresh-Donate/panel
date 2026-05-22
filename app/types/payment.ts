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
  providerConfig: Record<string, any>
  commissionPercent: number
  commissionRule: CommissionRule
  supportedCurrencies: string[]
}
