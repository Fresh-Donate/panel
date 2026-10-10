interface DragSource {
  productId: string
  from: string
}

export function useProductDrag(onMove: (productId: string, from: string, to: string) => void) {
  const source = ref<DragSource | null>(null)
  const target = ref<string | null>(null)

  function start(event: DragEvent, productId: string, from: string) {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', productId)
    }
    // Chrome cancels the drag if the DOM changes inside dragstart.
    setTimeout(() => {
      source.value = { productId, from }
    })
  }

  function over(event: DragEvent, key: string) {
    if (!source.value || source.value.from === key) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    target.value = key
  }

  function leave(event: DragEvent, key: string) {
    const el = event.currentTarget as HTMLElement
    if (target.value === key && !el.contains(event.relatedTarget as Node | null)) target.value = null
  }

  function drop(event: DragEvent, key: string) {
    const current = source.value
    end()
    if (!current || current.from === key) return
    event.preventDefault()
    onMove(current.productId, current.from, key)
  }

  function end() {
    source.value = null
    target.value = null
  }

  function isDragged(productId: string, from: string) {
    return source.value?.productId === productId && source.value.from === from
  }

  return { source, target, start, over, leave, drop, end, isDragged }
}
