export type ShopFieldType
  = | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'select'
    | 'color'
    | 'url'
    | 'email'
    | 'date'
    | 'datetime'
    | 'image'
    | 'file'
    | 'list'

export type ShopFieldPrimitive = string | number | boolean | null
export type ShopFieldValue = ShopFieldPrimitive | string[] | ShopFieldItem[]
export type ShopFieldItem = { [key: string]: ShopFieldValue }

export interface ShopFieldOption {
  value: string
  label: string
}

export interface ShopFieldCondition {
  key: string
  equals: ShopFieldPrimitive | ShopFieldPrimitive[]
}

export interface ShopField {
  key: string
  type: ShopFieldType
  label: string
  description?: string
  placeholder?: string
  icon?: string
  required?: boolean
  default?: ShopFieldValue
  visibleIf?: ShopFieldCondition
  min?: number
  max?: number
  step?: number
  integer?: boolean
  pattern?: string
  rows?: number
  options?: ShopFieldOption[]
  multiple?: boolean
  format?: 'hex' | 'tailwind'
  accept?: string
  fields?: ShopField[]
  addLabel?: string
  titleKey?: string
}

export interface ShopFieldGroup {
  id: string
  label: string
  description?: string
  icon?: string
  fields: ShopField[]
}

export interface ShopSettingsSchema {
  version: number
  groups: ShopFieldGroup[]
}

export interface ShopSettings {
  shopUrl: string
  fields: ShopFieldItem
}

export type ShopSchemaSource = 'live' | 'snapshot' | 'legacy'
