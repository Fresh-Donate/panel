<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const config = useRuntimeConfig()

const open = ref(false)

// Build info
interface ServiceInfo { name: string, version: string }

const services = ref<ServiceInfo[]>([])

onMounted(async () => {
  const results: ServiceInfo[] = []

  const endpoints = [
    { url: '/api/version', label: 'Panel' },
    { url: `${config.public.apiBase}`, label: 'Backend' },
    { url: `${config.public.shopBase}/api/version`, label: 'Shop' }
  ]

  await Promise.allSettled(
    endpoints.map(async (ep) => {
      try {
        const data = await $fetch<{ version: string }>(ep.url)
        results.push({ name: ep.label, version: data.version })
      } catch {
        // skip unreachable services
      }
    })
  )

  services.value = results
})

const links = [[{
  label: 'Главная',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Товары',
  icon: 'i-lucide-package',
  to: '/products',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Платежи',
  icon: 'i-lucide-receipt',
  to: '/payments',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Клиенты',
  icon: 'i-lucide-users',
  to: '/customers',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Страница магазина',
  to: '/shop/settings',
  icon: 'i-lucide-store',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Общее',
    to: '/shop/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Платёжные системы',
    to: '/shop/settings/payments',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Методы оплаты',
    to: '/shop/settings/payment-options',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Настройки',
  to: '/settings',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Общее',
    to: '/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Уведомления',
    badge: 'Soon',
    to: '/settings/notifications',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Безопасность',
    badge: 'Soon',
    to: '/settings/security',
    onSelect: () => {
      open.value = false
    }
  }]
}], [{
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
        <div
          v-if="!collapsed && services.length > 0"
          class="p-1 text-[10px] text-muted font-mono leading-relaxed w-full"
        >
          <div
            v-for="svc in services"
            :key="svc.name"
            class="flex items-center justify-between"
          >
            <span>{{ svc.name }}</span>
            <span class="text-muted/60">{{ svc.version }}</span>
          </div>
        </div>
        <div
          v-else-if="collapsed && services.length > 0"
          class="flex justify-center items-center py-2 w-full"
        >
          <UTooltip
            :text="services.map(s => `${s.name} ${s.version}`).join(' | ')"
          >
            <UButton
              icon="i-lucide-info"
              variant="ghost"
              color="neutral"
              size="sm"
            />
          </UTooltip>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
