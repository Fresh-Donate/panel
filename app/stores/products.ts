import type { Product } from '~/types'

export const useProductsStore = defineStore('products', () => {
  const api = useApi()
  const items = ref<Product[]>([])

  const nameById = computed(() => new Map(items.value.map(p => [p.id, p.name])))

  async function load(): Promise<void> {
    items.value = await api<Product[]>('/products/all')
  }

  function upsert(product: Product): void {
    const idx = items.value.findIndex(p => p.id === product.id)
    if (idx === -1) items.value.unshift(product)
    else items.value[idx] = product
  }

  async function remove(id: string): Promise<void> {
    await api(`/products/${id}`, { method: 'DELETE' })
    items.value = items.value.filter(p => p.id !== id)
  }

  async function duplicate(id: string): Promise<Product> {
    const copy = await api<Product>(`/products/${id}/duplicate`, { method: 'POST' })
    items.value.unshift(copy)
    return copy
  }

  return { items, nameById, load, upsert, remove, duplicate }
})
