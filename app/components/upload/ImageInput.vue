<script setup lang="ts">
const url = defineModel<string>('url', { default: '' })

const props = withDefaults(defineProps<{
  endpoint?: string
}>(), {
  endpoint: '/uploads/product-image'
})

const api = useApi()
const notify = useNotify()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Client-side gate so a 50 MB phone photo doesn't even start the request;
  // backend has its own hard ceiling.
  const MAX_BYTES = 10 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    notify.error('Файл слишком большой', 'Максимальный размер изображения - 10 МБ.')
    target.value = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    notify.error('Неподдерживаемый формат', 'Загрузите PNG, JPEG, WebP или GIF.')
    target.value = ''
    return
  }

  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)

    const res = await api<{ url: string }>(props.endpoint, { method: 'POST', body: form })
    url.value = res.url
    notify.success('Изображение загружено')
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить изображение.')
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
          PNG, JPEG, WebP или GIF, до 10 МБ.
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
