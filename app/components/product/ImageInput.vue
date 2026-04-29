<script setup lang="ts">
/**
 * Two-track product-image input: pick a file (uploaded + recompressed by
 * the backend) OR paste an external URL. Either way, the parent
 * `v-model:url` ends up holding the final URL string that gets persisted
 * on the product. The component owns just the upload state.
 */
const url = defineModel<string>('url', { default: '' })

const config = useRuntimeConfig()
const token = useCookie('auth_token')
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Client-side gate so a 50 MB phone photo doesn't even start the request.
  // Server enforces its own ceiling — this is purely UX.
  const MAX_BYTES = 10 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    toast.add({
      title: 'Файл слишком большой',
      description: 'Максимальный размер изображения — 10 МБ.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    target.value = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    toast.add({
      title: 'Неподдерживаемый формат',
      description: 'Загрузите PNG, JPEG, WebP или GIF.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    target.value = ''
    return
  }

  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)

    const res = await $fetch<{ url: string }>('/uploads/product-image', {
      baseURL: config.public.apiBase as string,
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: form
    })

    url.value = res.url
    toast.add({
      title: 'Изображение загружено',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Не удалось загрузить',
      description: 'Проверьте файл и попробуйте снова.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    uploading.value = false
    target.value = ''
  }
}

function clear() {
  url.value = ''
}
</script>

<template>
  <div class="space-y-3">
    <!-- Preview / placeholder -->
    <div class="flex items-start gap-3">
      <div class="size-20 rounded-lg overflow-hidden bg-elevated border border-default flex items-center justify-center shrink-0">
        <img
          v-if="url"
          :src="url"
          alt=""
          class="size-full object-cover"
        >
        <UIcon
          v-else
          name="i-lucide-image"
          class="size-8 text-muted/40"
        />
      </div>

      <div class="flex-1 min-w-0 space-y-2">
        <div class="flex flex-wrap gap-2">
          <UButton
            label="Загрузить файл"
            icon="i-lucide-upload"
            size="sm"
            variant="soft"
            :loading="uploading"
            @click="fileInput?.click()"
          />
          <UButton
            v-if="url"
            label="Удалить"
            icon="i-lucide-trash-2"
            size="sm"
            variant="ghost"
            color="neutral"
            @click="clear"
          />
        </div>
        <p class="text-xs text-muted">
          PNG, JPEG, WebP или GIF, до 10 МБ. Изображение автоматически
          сжимается и кэшируется.
        </p>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      class="hidden"
      @change="onFileSelected"
    >

    <UInput
      v-model="url"
      placeholder="…или вставьте ссылку https://…"
      icon="i-lucide-link"
      class="w-full"
    />
  </div>
</template>
