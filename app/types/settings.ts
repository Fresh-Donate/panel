import type { Currency } from './product'

export type DeliveryMethod = 'rcon' | 'plugin'

export interface SmtpConfig {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  passwordSet: boolean
  fromEmail: string
  fromName: string
}

export interface ReceiptTemplate {
  subject: string
  html: string
}

export interface ReceiptPlaceholder {
  key: string
  description: string
}

export interface Settings {
  demo_payments: boolean
  delivery_method: DeliveryMethod
  rcon_config: { host: string, port: number, password: string }
  plugin_config: { token: string }
  multi_server_enabled: boolean
  base_currency: Currency
  currency_rates: Record<string, number>
  telemetry_enabled: boolean
  installation_id: string
  smtp_config: SmtpConfig
  receipt_template: ReceiptTemplate
}

export type SettingsPatch = Partial<Omit<Settings, 'installation_id'>>
