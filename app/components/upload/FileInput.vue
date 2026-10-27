<script setup lang="ts">
const url = defineModel<string>('url', { default: '' })

const props = withDefaults(defineProps<{
  endpoint?: string
  accept?: string
}>(), {
  endpoint: '/uploads/shop-file',
  accept: undefined
})

const api = useApi()
const notify = useNotify()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const fileName = computed(() => {
  if (!url.value) return ''
  try {
    const last = new URL(url.value).pathname.split('/').filter(Boolean).pop() ?? ''
    return decodeURIComponent(last) || url.value
  } catch {
    return url.value
  }
})

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)

    const res = await api<{ url: string }>(props.endpoint, { method: 'POST', body: form })
    url.value = res.url
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить файл.')
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
    <div class="flex items-center gap-3">
      <div class="size-12 rounded-lg bg-elevated border border-default flex items-center justify-center shrink-0">
        <UIcon
          :name="url ? 'i-lucide-file-check' : 'i-lucide-file'"
          class="size-6 text-muted"
        />
      </div>

      <div class="flex-1 min-w-0 space-y-2">
        <ULink
          v-if="url"
          :to="url"
          target="_blank"
          class="block truncate text-sm"
        >
          {{ fileName }}
        </ULink>
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
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      :accept="accept"
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
