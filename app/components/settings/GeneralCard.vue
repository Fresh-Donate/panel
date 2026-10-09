<script setup lang="ts">
import type { Settings } from '~/types'

const props = defineProps<{
  settings: Settings
}>()

const store = useSettingsStore()
const notify = useNotify()

const state = reactive({
  demo_payments: props.settings.demo_payments,
  telemetry_enabled: props.settings.telemetry_enabled
})
const saving = ref(false)

async function save() {
  saving.value = true
  try {
    const data = await store.update({ ...state })
    state.demo_payments = data.demo_payments
    state.telemetry_enabled = data.telemetry_enabled
    notify.success('Настройки сохранены')
  } catch (err) {
    notify.apiError(err, 'Не удалось сохранить.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Общие настройки"
    description="Ключевые настройки магазина и панели."
  >
    <div class="space-y-6">
      <UFormField
        label="Режим демо-платежей"
        description="Платежи из магазина будут автоматически приниматься и не будут взимать плату."
      >
        <USwitch v-model="state.demo_payments" />
      </UFormField>

      <USeparator />

      <UFormField
        label="Анонимная телеметрия"
        description="Отправлять анонимные данные об инсталляции (версия, ОС, включённые шлюзы, способ выдачи) в FreshDonate. Помогает понимать, какие версии и конфигурации используются. Не содержит ников, email, ключей и сумм."
      >
        <USwitch v-model="state.telemetry_enabled" />
      </UFormField>

      <div
        v-if="settings.installation_id"
        class="text-xs text-muted font-mono"
      >
        Installation ID: {{ settings.installation_id }}
      </div>

      <USeparator />

      <div>
        <UButton
          label="Сохранить"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </div>
  </UPageCard>
</template>
