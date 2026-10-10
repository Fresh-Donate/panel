export type CommissionMode = 'seller' | 'buyer' | 'split'

export interface CommissionRule {
  mode: CommissionMode
  customPercent?: number
}

export interface FiscalizationConfig {
  enabled?: boolean
  sno?: string
  tax?: string
  paymentMethod?: string
  paymentObject?: string
  vatCode?: number
  paymentMode?: string
  paymentSubject?: string
}

export interface ProviderConfig {
  coinPackages?: Record<string, string>
  fiscalization?: FiscalizationConfig
  [key: string]: unknown
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
  secretCredentials: Record<string, boolean>
  providerConfig: ProviderConfig
  commissionPercent: number
  commissionRule: CommissionRule
  supportedCurrencies: string[]
  minAmount: number
}

export interface PaymentOption {
  id: string
  name: string
  icon: string
  providerId: string
  redirectUrl: string | null
  sortOrder: number
  enabled: boolean
}

export const PROVIDER_NAMES: Record<string, string> = {
  wata: 'Wata',
  robokassa: 'Robokassa',
  tebex: 'Tebex',
  heleket: 'Heleket',
  yookassa: 'YooKassa',
  cryptobot: 'CryptoBot'
}

export function providerName(providerId: string | null): string {
  return providerId ? (PROVIDER_NAMES[providerId] || providerId) : 'Не задан'
}

export const MIN_AMOUNT_LOWER = 0.01
export const MIN_AMOUNT_UPPER = 10000
