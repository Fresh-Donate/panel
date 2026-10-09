<script setup lang="ts">
import type { DeliveryMethod, Settings } from '~/types'

const props = defineProps<{
  settings: Settings
}>()

const store = useSettingsStore()
const notify = useNotify()
const confirm = useConfirm()

const methods: { value: DeliveryMethod, label: string, description: string, icon: string }[] = [
  { value: 'rcon', label: 'RCON', description: 'Подключение к серверу через RCON протокол для выполнения команд', icon: 'i-lucide-terminal' },
  { value: 'plugin', label: 'Плагин', description: 'Установите плагин на сервер для автоматической выдачи', icon: 'i-lucide-puzzle' }
]

const deliveryMethod = ref<DeliveryMethod>(props.settings.delivery_method)
const savedDeliveryMethod = ref<DeliveryMethod>(props.settings.delivery_method)
const rcon = reactive({ host: '', port: 25575, password: '' })
const plugin = reactive({ token: '' })
const saving = ref(false)

function apply(data: Settings) {
  deliveryMethod.value = data.delivery_method
  savedDeliveryMethod.value = data.delivery_method
  rcon.host = data.rcon_config?.host || ''
  rcon.port = data.rcon_config?.port || 25575
  rcon.password = data.rcon_config?.password || ''
  plugin.token = data.plugin_config?.token || ''
}
apply(props.settings)

async function selectMethod(method: DeliveryMethod) {
  if (method === deliveryMethod.value) return
  const confirmed = await confirm({
    title: 'Сменить способ выдачи?',
    description: 'Текущий способ выдачи будет заменён. Убедитесь, что новый метод настроен корректно, иначе товары не будут выдаваться.',
    confirmLabel: 'Сменить',
    color: 'warning'
  })
  if (confirmed) deliveryMethod.value = method
}

function regenerateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  plugin.token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

async function save() {
  saving.value = true
  try {
    const data = await store.update(deliveryMethod.value === 'rcon'
      ? { delivery_method: 'rcon', rcon_config: { ...rcon } }
      : { delivery_method: 'plugin', plugin_config: { ...plugin } })
    apply(data)
    notify.success('Настройки выдачи сохранены')
  } catch (err) {
    notify.apiError(err, 'Не удалось сохранить настройки выдачи.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Выдача товаров"
    description="Выберите способ выдачи товаров игрокам после оплаты."
  >
    <div class="grid grid-cols-2 gap-3 mb-6">
      <button
        v-for="method in methods"
        :key="method.value"
        type="button"
        class="relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer text-left"
        :class="deliveryMethod === method.value
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-default bg-elevated hover:border-muted'"
        @click="selectMethod(method.value)"
      >
        <UBadge
          v-if="savedDeliveryMethod === method.value"
          label="Активен"
          color="success"
          variant="subtle"
          size="xs"
          class="absolute top-3 right-3"
        />
        <div
          class="size-12 rounded-xl flex items-center justify-center shrink-0"
          :class="deliveryMethod === method.value ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'"
        >
          <UIcon
            :name="method.icon"
            class="size-6"
          />
        </div>
        <div>
          <p class="font-semibold">
            {{ method.label }}
          </p>
          <p class="text-xs text-muted mt-0.5">
            {{ method.description }}
          </p>
        </div>
      </button>
    </div>

    <div
      v-if="deliveryMethod === 'rcon'"
      class="space-y-4"
    >
      <div class="flex gap-3 p-3 rounded-lg bg-info/10 border border-info/20 mb-4">
        <UIcon
          name="i-lucide-info"
          class="size-5 text-info shrink-0 mt-0.5"
        />
        <p class="text-xs text-muted">
          Убедитесь, что RCON включён в <span class="font-mono">server.properties</span>: <span class="font-mono">enable-rcon=true</span>, <span class="font-mono">rcon.port=25575</span>, <span class="font-mono">rcon.password=your_password</span>.
        </p>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <UFormField
          label="Хост"
          class="col-span-2"
        >
          <UInput
            v-model="rcon.host"
            placeholder="127.0.0.1 или адрес сервера"
            icon="i-lucide-server"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Порт">
          <UInput
            v-model.number="rcon.port"
            type="number"
            placeholder="25575"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Пароль RCON">
        <UInput
          v-model="rcon.password"
          type="password"
          placeholder="Пароль из server.properties"
          icon="i-lucide-lock"
          class="w-full max-w-lg"
        />
      </UFormField>
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <div class="flex gap-3 p-3 rounded-lg bg-info/10 border border-info/20">
        <UIcon
          name="i-lucide-info"
          class="size-5 text-info shrink-0 mt-0.5"
        />
        <p class="text-xs text-muted">
          Скачайте плагин и поместите его в папку <span class="font-mono">plugins/</span> вашего сервера. Плагин автоматически подключится к FreshDonate и будет выдавать товары.
        </p>
      </div>

      <div class="flex items-center gap-4 p-5 rounded-xl border border-default bg-elevated">
        <div class="size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-puzzle"
            class="size-7 text-primary"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold">
            FreshDonate Plugin
          </p>
          <p class="text-sm text-muted mt-0.5">
            Для Spigot / Paper 1.13.2+
          </p>
        </div>
        <UButton
          to="https://github.com/Fresh-Donate/plugin/releases/latest"
          target="_blank"
          label="Скачать .jar"
          icon="i-lucide-download"
          variant="soft"
        />
      </div>

      <UFormField
        label="Токен плагина"
        description="Используется для авторизации плагина. Укажите этот токен в config.yml плагина."
      >
        <div class="flex gap-2 max-w-lg">
          <UInput
            v-model="plugin.token"
            readonly
            class="w-full font-mono text-sm"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="soft"
            color="neutral"
            square
            @click="regenerateToken"
          />
        </div>
      </UFormField>

      <div class="p-4 rounded-lg bg-muted/5 border border-default">
        <p class="text-sm font-medium mb-2">
          Установка:
        </p>
        <ol class="text-xs text-muted space-y-1.5 list-decimal list-inside">
          <li>Скачайте <span class="font-mono">FreshDonate.jar</span></li>
          <li>Поместите файл в папку <span class="font-mono">plugins/</span> сервера</li>
          <li>Перезапустите сервер</li>
          <li>В файле <span class="font-mono">plugins/FreshDonate/config.yml</span> укажите токен выше</li>
        </ol>
      </div>
    </div>

    <USeparator class="my-4" />

    <div>
      <UButton
        label="Сохранить"
        icon="i-lucide-save"
        :loading="saving"
        @click="save"
      />
    </div>
  </UPageCard>
</template>
