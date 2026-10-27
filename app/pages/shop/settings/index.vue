<script setup lang="ts">
import type { ShopFieldItem, ShopSchemaSource, ShopSettings, ShopSettingsSchema } from '~/types'

type LiveSchema
  = | { status: 'ok', schema: ShopSettingsSchema }
    | { status: 'missing' | 'invalid' | 'unreachable' }

const api = useApi()
const notify = useNotify()

const fetching = ref(true)
const loadingSchema = ref(false)
const shopUrl = ref('')
const values = ref<ShopFieldItem>({})
const schema = ref<ShopSettingsSchema | null>(null)
const source = ref<ShopSchemaSource | null>(null)
const liveStatus = ref<LiveSchema['status'] | null>(null)

const supported = computed(() => schema.value?.version === SHOP_SCHEMA_VERSION)

async function fetchLiveSchema(url: string): Promise<LiveSchema> {
  if (!url) return { status: 'unreachable' }
  try {
    const data = await $fetch<unknown>(`${url}/api/settings-schema`, { timeout: 5000 })
    return isShopSchema(data) ? { status: 'ok', schema: data } : { status: 'invalid' }
  } catch (err) {
    return (err as { statusCode?: number }).statusCode === 404 ? { status: 'missing' } : { status: 'unreachable' }
  }
}

async function loadSchema() {
  loadingSchema.value = true
  try {
    const [live, snapshot] = await Promise.all([
      fetchLiveSchema(shopUrl.value),
      api<{ schema: ShopSettingsSchema | null }>('/shop-settings/schema').then(r => r.schema).catch(() => null)
    ])
    liveStatus.value = live.status

    if (live.status === 'ok') {
      schema.value = live.schema
      source.value = 'live'
    } else if (live.status === 'missing') {
      schema.value = LEGACY_SHOP_SCHEMA
      source.value = 'legacy'
    } else if (snapshot) {
      schema.value = snapshot
      source.value = 'snapshot'
    } else {
      schema.value = null
      source.value = null
    }
  } finally {
    loadingSchema.value = false
  }
}

async function load() {
  fetching.value = true
  try {
    const data = await api<ShopSettings>('/shop-settings')
    shopUrl.value = data.shopUrl
    values.value = data.fields
    await loadSchema()
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить настройки магазина.', 'Ошибка загрузки')
  } finally {
    fetching.value = false
  }
}

onMounted(load)

async function onAddressSaved(url: string) {
  shopUrl.value = url
  await loadSchema()
}

function onSaved(data: ShopSettings) {
  values.value = data.fields
}

const retryAction = [{ label: 'Повторить', icon: 'i-lucide-refresh-cw', onClick: () => loadSchema() }]
</script>

<template>
  <UDashboardPanel id="shop-settings">
    <template #header>
      <UDashboardNavbar title="Настройки магазина">
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
        v-else
        class="space-y-6"
      >
        <ShopSettingsAddressCard
          :shop-url="shopUrl"
          @saved="onAddressSaved"
        />

        <div
          v-if="loadingSchema"
          class="flex items-center justify-center py-12"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-8 animate-spin text-muted"
          />
        </div>

        <template v-else>
          <UAlert
            v-if="source === 'snapshot'"
            color="warning"
            variant="subtle"
            icon="i-lucide-cloud-off"
            :title="liveStatus === 'invalid' ? 'Магазин вернул некорректную схему настроек' : 'Магазин не ответил'"
            description="Форма построена по последней сохранённой схеме."
            :actions="retryAction"
          />

          <UAlert
            v-else-if="source === 'legacy'"
            color="info"
            variant="subtle"
            icon="i-lucide-info"
            title="Магазин не отдаёт схему настроек"
            description="Показаны стандартные поля."
          />

          <UAlert
            v-else-if="!schema && !shopUrl"
            color="info"
            variant="subtle"
            icon="i-lucide-info"
            title="Нет адреса магазина"
          />

          <UAlert
            v-else-if="!schema"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            :title="liveStatus === 'invalid' ? 'Магазин вернул некорректную схему настроек' : 'Не удалось получить схему настроек'"
            :description="`${shopUrl}/api/settings-schema`"
            :actions="retryAction"
          />

          <UAlert
            v-if="schema && !supported"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            :title="`Схема настроек версии ${schema.version} не поддерживается`"
            description="Обновите панель."
          />

          <ShopSettingsFieldsForm
            v-else-if="schema"
            :schema="schema"
            :values="values"
            @saved="onSaved"
          />
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
