import type { FormError } from '@nuxt/ui'
import type { ShopField, ShopFieldItem, ShopFieldPrimitive, ShopFieldType, ShopFieldValue, ShopSettingsSchema } from '~/types'

export const SHOP_SCHEMA_VERSION = 1

export const SHOP_FIELD_TYPES: readonly ShopFieldType[] = [
  'text', 'textarea', 'number', 'boolean', 'select', 'color', 'url', 'email', 'date', 'datetime', 'image', 'file', 'list'
]

export const LEGACY_SHOP_SCHEMA: ShopSettingsSchema = {
  version: 1,
  groups: [
    {
      id: 'general',
      label: 'Общие настройки',
      fields: [
        { key: 'name', type: 'text', label: 'Название магазина', icon: 'i-lucide-store', required: true, max: 64, default: 'FreshDonate Shop' },
        { key: 'description', type: 'textarea', label: 'Описание', max: 500, rows: 3, default: '' },
        { key: 'ip', type: 'text', label: 'Адрес сервера', icon: 'i-lucide-link', max: 64, placeholder: 'play.example.com', default: 'play.example.com' },
        { key: 'color', type: 'color', format: 'tailwind', label: 'Основной цвет', required: true, default: 'sky' },
        {
          key: 'cartEnabled',
          type: 'boolean',
          label: 'Корзина',
          description: 'Несколько товаров одним платежом. Без корзины товар покупается в один клик.',
          default: false
        }
      ]
    },
    {
      id: 'legal',
      label: 'Юридическая информация',
      description: 'Подставляется в оферту, соглашение и политику конфиденциальности. Пустые поля выводятся как «не указано».',
      fields: [
        { key: 'ownerName', type: 'text', label: 'Владелец магазина', icon: 'i-lucide-user', description: 'ФИО или полное наименование организации.', max: 256, placeholder: 'Иванов Иван Иванович' },
        {
          key: 'ownerType',
          type: 'select',
          label: 'Тип владельца',
          default: '',
          options: [
            { value: '', label: 'Не указывать' },
            { value: 'individual', label: 'Физическое лицо' },
            { value: 'self_employed', label: 'Самозанятый (НПД)' },
            { value: 'sole_proprietor', label: 'Индивидуальный предприниматель' },
            { value: 'legal_entity', label: 'Юридическое лицо' }
          ]
        },
        { key: 'ownerInn', type: 'text', label: 'ИНН', icon: 'i-lucide-hash', description: '10 цифр для юрлиц, 12 для остальных.', max: 12, pattern: '^(\\d{10}|\\d{12})$', placeholder: '123456789012' },
        { key: 'contactEmail', type: 'email', label: 'Контактный email', icon: 'i-lucide-mail', description: 'Для запросов по 152-ФЗ и претензий по покупкам.', placeholder: 'contact@example.com' }
      ]
    }
  ]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEX_RE = /^#[0-9a-fA-F]{6}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFieldShape(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (typeof value.key !== 'string' || typeof value.type !== 'string' || typeof value.label !== 'string') return false
  if (value.type === 'select' && !Array.isArray(value.options)) return false
  return !(value.type === 'list' && !(Array.isArray(value.fields) && value.fields.every(isFieldShape)))
}

export function isShopSchema(value: unknown): value is ShopSettingsSchema {
  if (!isRecord(value) || typeof value.version !== 'number' || !Array.isArray(value.groups)) return false
  return value.groups.every(group => isRecord(group)
    && typeof group.id === 'string'
    && typeof group.label === 'string'
    && Array.isArray(group.fields)
    && group.fields.every(isFieldShape))
}

export function isShopFieldVisible(field: ShopField, values: ShopFieldItem, scope: ShopField[]): boolean {
  const condition = field.visibleIf
  if (!condition) return true
  const current = values[condition.key] !== undefined
    ? values[condition.key]
    : scope.find(f => f.key === condition.key)?.default
  return Array.isArray(condition.equals)
    ? condition.equals.includes(current as ShopFieldPrimitive)
    : condition.equals === current
}

function fallback(field: ShopField): ShopFieldValue {
  const value = field.default
  switch (field.type) {
    case 'boolean':
      return typeof value === 'boolean' ? value : false
    case 'number':
      return typeof value === 'number' ? value : null
    case 'select': {
      const allowed = (field.options ?? []).map(o => o.value)
      if (field.multiple) return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && allowed.includes(v)) : []
      return typeof value === 'string' && allowed.includes(value) ? value : allowed[0] ?? ''
    }
    case 'list':
      return Array.isArray(value) ? value.filter(isRecord).map(item => resolveShopFields(field.fields ?? [], item)) : []
    default:
      return typeof value === 'string' ? value : ''
  }
}

export function resolveShopField(field: ShopField, raw: unknown): ShopFieldValue {
  if (raw === undefined) return fallback(field)
  switch (field.type) {
    case 'boolean':
      return typeof raw === 'boolean' ? raw : fallback(field)
    case 'number':
      return raw === null || (typeof raw === 'number' && Number.isFinite(raw)) ? raw : fallback(field)
    case 'select': {
      const allowed = new Set((field.options ?? []).map(o => o.value))
      if (field.multiple) {
        return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string' && allowed.has(v)) : fallback(field)
      }
      return typeof raw === 'string' && allowed.has(raw) ? raw : fallback(field)
    }
    case 'list':
      return Array.isArray(raw) ? raw.filter(isRecord).map(item => resolveShopFields(field.fields ?? [], item)) : fallback(field)
    default:
      return typeof raw === 'string' ? raw : fallback(field)
  }
}

export function resolveShopFields(fields: ShopField[], raw: unknown): ShopFieldItem {
  const source = isRecord(raw) ? raw : {}
  return Object.fromEntries(fields.map(field => [field.key, resolveShopField(field, source[field.key])]))
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isEmpty(value: ShopFieldValue | undefined): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return !value.trim()
  return Array.isArray(value) && value.length === 0
}

function countError(field: ShopField, length: number): string | null {
  if (field.min !== undefined && length < field.min) return `Не меньше ${field.min}`
  if (field.max !== undefined && length > field.max) return `Не больше ${field.max}`
  return null
}

function fieldError(field: ShopField, value: ShopFieldValue | undefined): string | null {
  if (isEmpty(value)) return field.required ? 'Обязательное поле' : null
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const text = String(value)
      if (field.max !== undefined && text.length > field.max) return `Не длиннее ${field.max} символов`
      if (field.min !== undefined && text.length < field.min) return `Не короче ${field.min} символов`
      if (field.pattern && !new RegExp(field.pattern).test(text)) return 'Неверный формат'
      return null
    }
    case 'url':
    case 'image':
    case 'file':
      return isHttpUrl(String(value)) ? null : 'Нужна ссылка http:// или https://'
    case 'email':
      return EMAIL_RE.test(String(value)) ? null : 'Некорректный email'
    case 'color':
      return field.format === 'tailwind' || HEX_RE.test(String(value)) ? null : 'Цвет в формате #rrggbb'
    case 'number': {
      const number = Number(value)
      if (field.integer && !Number.isInteger(number)) return 'Нужно целое число'
      if (field.min !== undefined && number < field.min) return `Не меньше ${field.min}`
      if (field.max !== undefined && number > field.max) return `Не больше ${field.max}`
      return null
    }
    case 'select':
      return field.multiple && Array.isArray(value) ? countError(field, value.length) : null
    case 'list':
      return Array.isArray(value) ? countError(field, value.length) : null
    default:
      return null
  }
}

export function validateShopFields(fields: ShopField[], values: ShopFieldItem, prefix = ''): FormError[] {
  const errors: FormError[] = []
  for (const field of fields) {
    if (!isShopFieldVisible(field, values, fields)) continue
    const name = prefix ? `${prefix}.${field.key}` : field.key
    const value = values[field.key]
    const message = fieldError(field, value)
    if (message) errors.push({ name, message })
    if (field.type === 'list' && Array.isArray(value)) {
      (value as ShopFieldItem[]).forEach((item, index) => {
        errors.push(...validateShopFields(field.fields ?? [], item, `${name}.${index}`))
      })
    }
  }
  return errors
}
