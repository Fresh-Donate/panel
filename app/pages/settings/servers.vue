<script setup lang="ts">
import type { Server } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const toast = useToast()
const config = useRuntimeConfig()
const token = useCookie('auth_token')

function authHeaders() {
  return { Authorization: `Bearer ${token.value}` }
}

const fetching = ref(true)
const multiServerEnabled = ref(false)
const savedMultiServerEnabled = ref(false)
const deliveryMethod = ref<'rcon' | 'plugin'>('rcon')
const toggleLoading = ref(false)

const servers = ref<Server[]>([])

const showWarning = ref(false)
const showCreate = ref(false)
const showEdit = ref(false)

const newServer = reactive({ id: '', name: '', ip: '' })
const editing = ref<Server | null>(null)
const editForm = reactive({ name: '', ip: '' })

const createLoading = ref(false)
const editLoading = ref(false)

async function fetchAll() {
  fetching.value = true
  try {
    const settings = await $fetch<{
      multi_server_enabled: boolean
      delivery_method: 'rcon' | 'plugin'
    }>('/settings', {
      baseURL: config.public.apiBase as string,
      headers: authHeaders()
    })
    multiServerEnabled.value = settings.multi_server_enabled
    savedMultiServerEnabled.value = settings.multi_server_enabled
    deliveryMethod.value = settings.delivery_method

    if (settings.multi_server_enabled) {
      servers.value = await $fetch<Server[]>('/servers', {
        baseURL: config.public.apiBase as string,
        headers: authHeaders()
      })
    }
  } catch {
    toast.add({ title: 'Ошибка загрузки', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    fetching.value = false
  }
}

onMounted(fetchAll)

function requestToggle(next: boolean) {
  if (next === savedMultiServerEnabled.value) return
  if (next) {
    if (deliveryMethod.value !== 'plugin') {
      toast.add({
        title: 'Сначала включите плагин',
        description: 'Мультисервера работают только через плагин. Переключите способ выдачи в разделе «Настройки → Общее».',
        icon: 'i-lucide-info',
        color: 'warning'
      })
      multiServerEnabled.value = false
      return
    }
    multiServerEnabled.value = true
    showWarning.value = true
  } else {
    multiServerEnabled.value = false
    void persistMultiServer(false)
  }
}

async function persistMultiServer(enabled: boolean) {
  toggleLoading.value = true
  try {
    const data = await $fetch<{ multi_server_enabled: boolean }>('/settings', {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: authHeaders(),
      body: { multi_server_enabled: enabled }
    })
    savedMultiServerEnabled.value = data.multi_server_enabled
    multiServerEnabled.value = data.multi_server_enabled
    if (data.multi_server_enabled && servers.value.length === 0) {
      servers.value = await $fetch<Server[]>('/servers', {
        baseURL: config.public.apiBase as string,
        headers: authHeaders()
      })
    }
    toast.add({
      title: data.multi_server_enabled ? 'Мультисервера включены' : 'Мультисервера выключены',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch (err: any) {
    const message = err?.data?.error || 'Не удалось сохранить настройку.'
    toast.add({ title: 'Ошибка', description: message, icon: 'i-lucide-alert-circle', color: 'error' })
    multiServerEnabled.value = savedMultiServerEnabled.value
  } finally {
    toggleLoading.value = false
  }
}

function confirmEnable() {
  showWarning.value = false
  void persistMultiServer(true)
}

function cancelEnable() {
  showWarning.value = false
  multiServerEnabled.value = false
}

function openCreate() {
  newServer.id = ''
  newServer.name = ''
  newServer.ip = ''
  showCreate.value = true
}

async function createServer() {
  createLoading.value = true
  try {
    const body: Record<string, string> = { name: newServer.name }
    if (newServer.id.trim()) body.id = newServer.id.trim()
    if (newServer.ip.trim()) body.ip = newServer.ip.trim()
    const server = await $fetch<Server>('/servers', {
      baseURL: config.public.apiBase as string,
      method: 'POST',
      headers: authHeaders(),
      body
    })
    servers.value.unshift(server)
    showCreate.value = false
    toast.add({ title: 'Сервер создан', icon: 'i-lucide-check-circle', color: 'success' })
  } catch (err: any) {
    const message = err?.data?.error || 'Не удалось создать сервер.'
    toast.add({ title: 'Ошибка', description: message, icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    createLoading.value = false
  }
}

function openEdit(server: Server) {
  editing.value = server
  editForm.name = server.name
  editForm.ip = server.ip
  showEdit.value = true
}

async function updateServer() {
  if (!editing.value) return
  editLoading.value = true
  try {
    const updated = await $fetch<Server>(`/servers/${editing.value.id}`, {
      baseURL: config.public.apiBase as string,
      method: 'PUT',
      headers: authHeaders(),
      body: { name: editForm.name, ip: editForm.ip }
    })
    const idx = servers.value.findIndex(s => s.id === updated.id)
    if (idx !== -1) servers.value[idx] = updated
    showEdit.value = false
    toast.add({ title: 'Сохранено', icon: 'i-lucide-check-circle', color: 'success' })
  } catch (err: any) {
    const message = err?.data?.error || 'Не удалось обновить сервер.'
    toast.add({ title: 'Ошибка', description: message, icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    editLoading.value = false
  }
}

async function deleteServer(server: Server) {
  if (!confirm(`Удалить сервер "${server.name}"? Привязки товаров к этому серверу сохранятся в истории, но новые выдачи на нём пойти не смогут.`)) {
    return
  }
  try {
    await $fetch(`/servers/${server.id}`, {
      baseURL: config.public.apiBase as string,
      method: 'DELETE',
      headers: authHeaders()
    })
    servers.value = servers.value.filter(s => s.id !== server.id)
    toast.add({ title: 'Сервер удалён', icon: 'i-lucide-trash-2', color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', description: 'Не удалось удалить сервер.', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    toast.add({ title: 'ID скопирован', icon: 'i-lucide-clipboard-check', color: 'success' })
  } catch {
    toast.add({ title: 'Не удалось скопировать', color: 'error' })
  }
}

function getActions(server: Server) {
  return [[{
    label: 'Скопировать ID',
    icon: 'i-lucide-copy',
    onSelect: () => copyId(server.id)
  }, {
    label: 'Редактировать',
    icon: 'i-lucide-pencil',
    onSelect: () => openEdit(server)
  }], [{
    label: 'Удалить',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => deleteServer(server)
  }]]
}

const columns: TableColumn<Server>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'id', header: 'ID (server id)' },
  { accessorKey: 'ip', header: 'IP' },
  { accessorKey: 'productIds', header: 'Товаров' },
  { accessorKey: 'actions', header: '' }
]
</script>

<template>
  <UDashboardPanel id="servers-settings">
    <template #header>
      <UDashboardNavbar title="Серверы">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            v-if="savedMultiServerEnabled"
            label="Добавить сервер"
            icon="i-lucide-plus"
            @click="openCreate"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="fetching"
        class="flex items-center justify-center py-16"
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
        <UPageCard
          title="Мультисервера"
          description="Возможность подключить несколько Minecraft-серверов к одной панели и выдавать товары на конкретные сервера."
        >
          <UFormField
            label="Включить мультисервера"
            description="Работает только через плагин (RCON не поддерживается). После включения в карточке каждого товара нужно будет выбрать сервера выдачи — товары без выбранных серверов скрываются на витрине."
          >
            <USwitch
              v-model="multiServerEnabled"
              :loading="toggleLoading"
              @update:model-value="requestToggle"
            />
          </UFormField>

          <div
            v-if="deliveryMethod !== 'plugin' && !savedMultiServerEnabled"
            class="mt-4 flex gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
          >
            <UIcon
              name="i-lucide-triangle-alert"
              class="size-5 text-warning shrink-0 mt-0.5"
            />
            <p class="text-xs text-muted">
              Сейчас активен способ выдачи <strong>RCON</strong>. Перед включением мультисерверов перейдите в
              <NuxtLink
                to="/settings"
                class="text-primary hover:underline"
              >
                «Настройки → Общее»
              </NuxtLink>
              и переключитесь на плагин.
            </p>
          </div>
        </UPageCard>

        <UPageCard
          v-if="savedMultiServerEnabled"
          title="Список серверов"
          description="Каждому серверу присваивается уникальный ID — его нужно указать в config.yml плагина как server-id."
        >
          <UTable
            v-if="servers.length > 0"
            :data="servers"
            :columns="columns"
          >
            <template #name-cell="{ row }">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-lg bg-elevated border border-default flex items-center justify-center shrink-0">
                  <UIcon
                    name="i-lucide-server"
                    class="size-5 text-primary"
                  />
                </div>
                <p class="font-medium">
                  {{ row.original.name }}
                </p>
              </div>
            </template>

            <template #id-cell="{ row }">
              <button
                type="button"
                class="font-mono text-xs px-2 py-1 rounded bg-elevated hover:bg-primary/10 hover:text-primary cursor-pointer"
                @click="copyId(row.original.id)"
              >
                {{ row.original.id }}
              </button>
            </template>

            <template #ip-cell="{ row }">
              <span class="text-sm text-muted">{{ row.original.ip || '—' }}</span>
            </template>

            <template #productIds-cell="{ row }">
              <UBadge
                :label="String(row.original.productIds.length)"
                variant="soft"
                color="neutral"
                size="sm"
              />
            </template>

            <template #actions-cell="{ row }">
              <UDropdownMenu :items="getActions(row.original)">
                <UButton
                  icon="i-lucide-ellipsis"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  square
                />
              </UDropdownMenu>
            </template>
          </UTable>

          <div
            v-else
            class="text-center py-12"
          >
            <UIcon
              name="i-lucide-server-off"
              class="size-12 text-muted/30 mx-auto"
            />
            <p class="mt-3 text-muted">
              Серверов пока нет
            </p>
            <UButton
              label="Добавить первый сервер"
              icon="i-lucide-plus"
              class="mt-4"
              @click="openCreate"
            />
          </div>
        </UPageCard>
      </div>

      <UModal v-model:open="showWarning">
        <template #content>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <UIcon
                  name="i-lucide-triangle-alert"
                  class="size-5 text-warning"
                />
              </div>
              <div>
                <h3 class="font-bold">
                  Включить мультисервера?
                </h3>
                <p class="text-sm text-muted mt-0.5">
                  Это может привести к последствиям. Будьте внимательны.
                </p>
              </div>
            </div>

            <ul class="text-sm text-muted space-y-1.5 list-disc list-inside">
              <li>Товары без выбранных серверов будут <strong class="text-default">скрыты на витрине магазина</strong> до настройки.</li>
              <li>Способ выдачи RCON будет недоступен — мультисервера работают только через плагин.</li>
              <li>Для каждого товара, на котором выбрано 2+ серверов, принудительная выдача включится автоматически.</li>
              <li>Плагин на каждом сервере должен указать уникальный server-id в своём config.yml — нельзя ставить один и тот же конфиг на два физических сервера, иначе выдача задвоится.</li>
            </ul>

            <div class="flex justify-end gap-3 pt-2">
              <UButton
                label="Отмена"
                variant="ghost"
                color="neutral"
                @click="cancelEnable"
              />
              <UButton
                label="Включить"
                color="warning"
                @click="confirmEnable"
              />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="showCreate">
        <template #content>
          <div class="p-6 space-y-4">
            <div>
              <h3 class="font-bold">
                Новый сервер
              </h3>
              <p class="text-sm text-muted mt-0.5">
                ID можно оставить пустым — он сгенерируется автоматически.
              </p>
            </div>

            <UFormField
              label="Название"
              required
            >
              <UInput
                v-model="newServer.name"
                placeholder="Survival, Hub, Anarchy..."
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="ID"
              description="Указывается в config.yml плагина как server-id. Маршрутизирует выдачу на конкретный сервер. Авторизация плагина — отдельный токен из «Настройки → Общее → Выдача». 4–64 символа: буквы, цифры, '_', '-'."
            >
              <UInput
                v-model="newServer.id"
                placeholder="оставьте пустым для авто-генерации"
                class="w-full font-mono text-sm"
              />
            </UFormField>

            <UFormField
              label="IP"
              description="Отображается только в админке, для удобства. Не используется для подключения."
            >
              <UInput
                v-model="newServer.ip"
                placeholder="play.example.com"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-2">
              <UButton
                label="Отмена"
                variant="ghost"
                color="neutral"
                @click="showCreate = false"
              />
              <UButton
                label="Создать"
                icon="i-lucide-plus"
                :loading="createLoading"
                :disabled="!newServer.name.trim()"
                @click="createServer"
              />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="showEdit">
        <template #content>
          <div class="p-6 space-y-4">
            <div>
              <h3 class="font-bold">
                Редактирование сервера
              </h3>
              <p
                v-if="editing"
                class="text-xs text-muted mt-0.5 font-mono"
              >
                ID: {{ editing.id }} (не меняется)
              </p>
            </div>

            <UFormField
              label="Название"
              required
            >
              <UInput
                v-model="editForm.name"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="IP"
              description="Отображается только в админке."
            >
              <UInput
                v-model="editForm.ip"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-2">
              <UButton
                label="Отмена"
                variant="ghost"
                color="neutral"
                @click="showEdit = false"
              />
              <UButton
                label="Сохранить"
                icon="i-lucide-save"
                :loading="editLoading"
                :disabled="!editForm.name.trim()"
                @click="updateServer"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
