<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const open = ref(false)

watch(() => route.fullPath, () => {
  open.value = false
})

const links = [[
  { label: 'Главная', icon: 'i-lucide-house', to: '/' },
  { label: 'Аналитика', icon: 'i-lucide-chart-line', to: '/analytics' },
  { label: 'Товары', icon: 'i-lucide-package', to: '/products' },
  { label: 'Акции', icon: 'i-lucide-tag', to: '/promotions' },
  { label: 'Группы', icon: 'i-lucide-layers', to: '/groups' },
  { label: 'Платежи', icon: 'i-lucide-receipt', to: '/payments' },
  { label: 'Клиенты', icon: 'i-lucide-users', to: '/customers' },
  {
    label: 'Страница магазина',
    to: '/shop/settings',
    icon: 'i-lucide-store',
    defaultOpen: true,
    type: 'trigger',
    children: [
      { label: 'Общее', to: '/shop/settings', exact: true },
      { label: 'Платёжные системы', to: '/shop/settings/payments' },
      { label: 'Методы оплаты', to: '/shop/settings/payment-options' }
    ]
  },
  {
    label: 'Настройки',
    to: '/settings',
    icon: 'i-lucide-settings',
    defaultOpen: true,
    type: 'trigger',
    children: [
      { label: 'Общее', to: '/settings', exact: true },
      { label: 'Сервера', badge: 'Beta', to: '/settings/servers' },
      { label: 'Уведомления', badge: 'Soon', to: '/settings/notifications' },
      { label: 'Безопасность', badge: 'Soon', to: '/settings/security' }
    ]
  }
], [{
  label: 'Проект на Github',
  icon: 'i-lucide-github',
  to: 'https://github.com/Fresh-Donate/panel',
  target: '_blank'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/Fresh-Donate/panel/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div
          v-if="collapsed"
          class="text-center w-full"
        >
          <h1 class="text-xl font-bold text-primary">
            FD
          </h1>
        </div>
        <div
          v-else
          class="text-center w-full"
        >
          <h1 class="text-xl font-bold text-primary">
            FreshDonate
          </h1>
          <p class="text-sm text-muted">
            Admin Panel
          </p>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        >
          <div class="relative w-full h-full">
            <p
              v-if="!collapsed"
              class="absolute"
            >
              Найти...
            </p>
          </div>
        </UDashboardSearchButton>

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="w-full space-y-2">
          <AppSecurityWarning :collapsed="collapsed" />
          <AppServiceVersions :collapsed="collapsed" />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
