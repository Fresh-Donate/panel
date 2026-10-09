<script setup lang="ts">
import type { ReceiptPlaceholder, ReceiptTemplate, Settings } from '~/types'

const props = defineProps<{
  settings: Settings
}>()

const api = useApi()
const store = useSettingsStore()
const notify = useNotify()

const template = reactive<ReceiptTemplate>({
  subject: props.settings.receipt_template?.subject || '',
  html: props.settings.receipt_template?.html || ''
})
const saving = ref(false)
const placeholders = ref<ReceiptPlaceholder[]>([])

const preview = reactive({ open: false, loading: false, subject: '', html: '' })

onMounted(async () => {
  const data = await api<{ placeholders: ReceiptPlaceholder[] }>('/settings/receipt/placeholders').catch(() => null)
  placeholders.value = data?.placeholders ?? []
})

async function save() {
  saving.value = true
  try {
    const data = await store.update({ receipt_template: { ...template } })
    Object.assign(template, data.receipt_template)
    notify.success('Шаблон чека сохранён')
  } catch (err) {
    notify.apiError(err, 'Не удалось сохранить шаблон.')
  } finally {
    saving.value = false
  }
}

async function openPreview() {
  preview.loading = true
  preview.open = true
  try {
    const data = await api<ReceiptTemplate>('/settings/receipt/preview', {
      method: 'POST',
      body: { template: { ...template } }
    })
    preview.subject = data.subject
    preview.html = data.html
  } catch (err) {
    notify.apiError(err, 'Не удалось построить превью.')
    preview.open = false
  } finally {
    preview.loading = false
  }
}

async function copyPlaceholder(key: string) {
  const placeholder = `{${key}}`
  try {
    await navigator.clipboard.writeText(placeholder)
    notify.success('Скопировано', placeholder, 'i-lucide-clipboard-check')
  } catch {
    notify.error('Не удалось скопировать')
  }
}
</script>

<template>
  <UPageCard
    title="Оформление чека"
    description="HTML-шаблон письма-подтверждения. Используйте плейсхолдеры {имя} для подстановки данных заказа."
  >
    <div class="space-y-4">
      <UFormField label="Тема письма">
        <UInput
          v-model="template.subject"
          placeholder="Чек о покупке - {productName}"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="HTML письма"
        :description="`Поддерживаются inline-стили (style=&quot;...&quot;) и таблицы. ${template.html.length} / 100000 символов.`"
      >
        <UTextarea
          v-model="template.html"
          :rows="18"
          placeholder="<html>...</html>"
          class="w-full font-mono text-xs"
        />
      </UFormField>

      <div>
        <p class="text-sm font-medium mb-2">
          Доступные плейсхолдеры
        </p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="ph in placeholders"
            :key="ph.key"
            type="button"
            :title="ph.description"
            class="text-xs px-2 py-1 rounded-md bg-elevated hover:bg-primary/10 hover:text-primary border border-default font-mono cursor-pointer transition-colors"
            @click="copyPlaceholder(ph.key)"
          >
            {{ '{' + ph.key + '}' }}
          </button>
        </div>
        <p class="text-xs text-muted mt-2">
          Кликните по плейсхолдеру, чтобы скопировать. Наведите курсор - увидите подсказку.
        </p>
      </div>

      <USeparator />

      <div class="flex gap-3">
        <UButton
          label="Сохранить"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
        <UButton
          label="Предпросмотр"
          icon="i-lucide-eye"
          variant="soft"
          color="neutral"
          @click="openPreview"
        />
      </div>
    </div>

    <UModal
      v-model:open="preview.open"
      title="Предпросмотр чека"
      :description="preview.subject ? `Тема: ${preview.subject}` : undefined"
      :ui="{ content: 'max-w-3xl' }"
    >
      <template #body>
        <div
          v-if="preview.loading"
          class="flex items-center justify-center py-10"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-6 animate-spin text-muted"
          />
        </div>
        <iframe
          v-else
          :srcdoc="preview.html"
          class="w-full min-h-[60vh] border border-default rounded-md bg-white"
          sandbox=""
        />
      </template>
    </UModal>
  </UPageCard>
</template>
