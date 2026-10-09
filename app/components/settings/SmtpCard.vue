<script setup lang="ts">
import type { Settings, SmtpConfig } from '~/types'

const props = defineProps<{
  settings: Settings
}>()

const api = useApi()
const store = useSettingsStore()
const notify = useNotify()

const PORT_PRESETS = [
  { label: '465 (SSL)', value: 465 },
  { label: '587 (STARTTLS)', value: 587 },
  { label: '25', value: 25 },
  { label: '2525', value: 2525 }
]

const smtp = reactive<SmtpConfig>({ ...props.settings.smtp_config })
const saving = ref(false)
const testing = ref(false)
const testEmail = ref('')

function applyPreset(port: number) {
  smtp.port = port
  smtp.secure = port === 465
}

async function save() {
  saving.value = true
  try {
    const data = await store.update({ smtp_config: { ...smtp } })
    Object.assign(smtp, data.smtp_config)
    notify.success('SMTP-настройки сохранены')
  } catch (err) {
    notify.apiError(err, 'Не удалось сохранить настройки SMTP.')
  } finally {
    saving.value = false
  }
}

async function sendTestEmail() {
  if (!testEmail.value) {
    notify.error('Укажите адрес', 'Введите email для тестового письма.')
    return
  }
  testing.value = true
  try {
    await api('/settings/smtp/test', { method: 'POST', body: { to: testEmail.value } })
    notify.success('Тестовое письмо отправлено', `Проверьте ${testEmail.value}.`)
  } catch (err) {
    notify.apiError(err, 'Не удалось отправить.', 'Ошибка SMTP')
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Отправка писем (SMTP)"
    description="Подтверждения покупок отправляются покупателям на email. Подключите свой почтовый ящик (Яндекс, Mail.ru, Timeweb и т.п.) - настройки SMTP подскажет ваш провайдер."
  >
    <div class="space-y-4">
      <UFormField
        label="Включить отправку"
        description="Если выключено, чеки не отправляются ни автоматически, ни вручную."
      >
        <USwitch v-model="smtp.enabled" />
      </UFormField>

      <USeparator />

      <div class="grid grid-cols-3 gap-3">
        <UFormField
          label="SMTP-хост"
          class="col-span-2"
        >
          <UInput
            v-model="smtp.host"
            placeholder="smtp.timeweb.ru"
            icon="i-lucide-server"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Порт">
          <UInput
            v-model.number="smtp.port"
            type="number"
            placeholder="465"
            class="w-full"
          />
          <template #help>
            <div class="flex flex-wrap gap-1 mt-1">
              <button
                v-for="preset in PORT_PRESETS"
                :key="preset.value"
                type="button"
                class="text-[10px] px-1.5 py-0.5 rounded bg-elevated hover:bg-muted/20 text-muted cursor-pointer"
                @click="applyPreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </template>
        </UFormField>
      </div>

      <UFormField
        label="Защищённое соединение (SSL/TLS)"
        description="Включено для порта 465. Для 587 (STARTTLS) - выключено."
      >
        <USwitch v-model="smtp.secure" />
      </UFormField>

      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Логин (обычно полный email)">
          <UInput
            v-model="smtp.user"
            placeholder="no-reply@example.com"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Пароль">
          <UInput
            v-model="smtp.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <UFormField
          label="Email отправителя"
          description="С какого адреса покупатель увидит письмо."
        >
          <UInput
            v-model="smtp.fromEmail"
            placeholder="no-reply@example.com"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Имя отправителя"
          description="Отображаемое имя рядом с адресом."
        >
          <UInput
            v-model="smtp.fromName"
            placeholder="FreshDonate Shop"
            class="w-full"
          />
        </UFormField>
      </div>

      <USeparator />

      <div class="flex items-end gap-3 flex-wrap">
        <UFormField
          label="Отправить тестовое письмо на"
          class="flex-1 min-w-[240px]"
        >
          <UInput
            v-model="testEmail"
            type="email"
            placeholder="test@example.com"
            icon="i-lucide-send"
            class="w-full"
          />
        </UFormField>
        <UButton
          label="Тест"
          icon="i-lucide-send"
          variant="soft"
          :loading="testing"
          :disabled="!smtp.host"
          @click="sendTestEmail"
        />
        <UButton
          label="Сохранить"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
      </div>

      <div class="flex gap-3 p-3 rounded-lg bg-info/10 border border-info/20">
        <UIcon
          name="i-lucide-info"
          class="size-5 text-info shrink-0 mt-0.5"
        />
        <p class="text-xs text-muted">
          Тестовое письмо уходит с сохранёнными настройками SMTP и сохранённым шаблоном чека - сначала сохраните изменения.
          Если письмо ушло в спам - проверьте DNS-записи SPF и DKIM у своего домена.
        </p>
      </div>
    </div>
  </UPageCard>
</template>
