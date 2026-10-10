<script setup lang="ts">
const store = useSettingsStore()
const { settings } = storeToRefs(store)
const notify = useNotify()

const fetching = ref(true)

onMounted(async () => {
  try {
    await store.load()
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить настройки.', 'Ошибка загрузки')
  } finally {
    fetching.value = false
  }
})
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Настройки">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="fetching"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <div
        v-else-if="settings"
        class="space-y-6"
      >
        <SettingsGeneralCard :settings="settings" />
        <SettingsCurrencyCard :settings="settings" />
        <SettingsDeliveryCard :settings="settings" />
        <SettingsSmtpCard :settings="settings" />
        <SettingsReceiptTemplateCard :settings="settings" />
      </div>
    </template>
  </UDashboardPanel>
</template>
