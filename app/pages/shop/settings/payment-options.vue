<script setup lang="ts">
import type { PaymentOption, PaymentProvider } from '~/types'

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()

const fetching = ref(true)
const options = ref<PaymentOption[]>([])
const providers = ref<{ providerId: string, name: string }[]>([])

const showForm = ref(false)
const editingOption = ref<PaymentOption | null>(null)

function describeOption(option: PaymentOption): string {
  if (option.redirectUrl) return 'Перенаправление по ссылке'
  return providers.value.find(p => p.providerId === option.providerId)?.name || option.providerId
}

async function fetchData() {
  fetching.value = true
  try {
    const [optionsData, providersData] = await Promise.all([
      api<PaymentOption[]>('/payment-options/all'),
      api<PaymentProvider[]>('/payment-providers')
    ])
    options.value = optionsData
    providers.value = providersData.map(p => ({ providerId: p.providerId, name: p.name }))
  } catch (err) {
    notify.apiError(err, 'Не удалось загрузить данные.', 'Ошибка загрузки')
  } finally {
    fetching.value = false
  }
}

onMounted(fetchData)

function openCreate() {
  editingOption.value = null
  showForm.value = true
}

function openEdit(option: PaymentOption) {
  editingOption.value = option
  showForm.value = true
}

function upsert(saved: PaymentOption) {
  const idx = options.value.findIndex(o => o.id === saved.id)
  if (idx === -1) options.value.push(saved)
  else options.value[idx] = saved
}

function onSaved(saved: PaymentOption) {
  upsert(saved)
  showForm.value = false
}

async function toggleEnabled(option: PaymentOption) {
  try {
    upsert(await api<PaymentOption>(`/payment-options/${option.id}`, {
      method: 'PUT',
      body: { enabled: !option.enabled }
    }))
  } catch (err) {
    notify.apiError(err, 'Не удалось изменить статус.')
  }
}

async function deleteOption(option: PaymentOption) {
  const confirmed = await confirm({
    title: `Удалить метод «${option.name}»?`,
    description: 'Покупатели больше не увидят этот вариант оплаты.',
    confirmLabel: 'Удалить'
  })
  if (!confirmed) return
  try {
    await api(`/payment-options/${option.id}`, { method: 'DELETE' })
    options.value = options.value.filter(o => o.id !== option.id)
    notify.success('Метод удалён', undefined, 'i-lucide-trash-2')
  } catch (err) {
    notify.apiError(err, 'Не удалось удалить метод оплаты.')
  }
}
</script>

<template>
  <UDashboardPanel id="payment-options">
    <template #header>
      <UDashboardNavbar title="Методы оплаты">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            label="Добавить"
            icon="i-lucide-plus"
            @click="openCreate"
          />
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

      <div v-else>
        <UPageCard
          title="Методы оплаты в магазине"
        >
          <!-- Empty state -->
          <div
            v-if="options.length === 0"
            class="text-center py-12"
          >
            <UIcon
              name="i-lucide-credit-card"
              class="size-16 text-muted/20 mx-auto"
            />
            <p class="mt-4 text-muted">
              Нет методов оплаты
            </p>
            <UButton
              label="Добавить первый метод"
              icon="i-lucide-plus"
              variant="soft"
              class="mt-3"
              @click="openCreate"
            />
          </div>

          <!-- Options list -->
          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="option in options"
              :key="option.id"
              class="flex items-center justify-between p-4 rounded-xl border border-default"
              :class="option.enabled ? 'bg-elevated' : 'opacity-60'"
            >
              <div class="flex items-center gap-4 min-w-0">
                <USwitch
                  :model-value="option.enabled"
                  @update:model-value="toggleEnabled(option)"
                />

                <div class="size-10 rounded-lg bg-muted/10 flex items-center justify-center shrink-0">
                  <UIcon
                    :name="option.icon"
                    class="size-5"
                  />
                </div>

                <div class="min-w-0">
                  <p class="font-semibold truncate">
                    {{ option.name }}
                  </p>
                  <p class="text-xs text-muted mt-0.5 truncate">
                    {{ describeOption(option) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  square
                  @click="openEdit(option)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  color="error"
                  size="sm"
                  square
                  @click="deleteOption(option)"
                />
              </div>
            </div>
          </div>
        </UPageCard>
      </div>

      <PaymentOptionFormSlideover
        v-model:open="showForm"
        :option="editingOption"
        :providers="providers"
        @saved="onSaved"
      />
    </template>
  </UDashboardPanel>
</template>
