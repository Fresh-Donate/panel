<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const config = useRuntimeConfig()

const open = ref(false)

interface ServiceInfo {
  name: string
  version: string
  repo: string
  latestVersion?: string
  outdated?: boolean
}

const REPO_BY_NAME: Record<string, string> = {
  Panel: 'Fresh-Donate/panel',
  Backend: 'Fresh-Donate/backend',
  Shop: 'Fresh-Donate/shop'
}

function compareVersions(a: string, b: string): number {
  const norm = (v: string) => v.replace(/^v/i, '').split(/[-+]/)[0] || ''
  const pa = norm(a).split('.').map(n => parseInt(n, 10) || 0)
  const pb = norm(b).split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const da = pa[i] || 0
    const db = pb[i] || 0
    if (da !== db) return da - db
  }
  return 0
}

const services = ref<ServiceInfo[]>([])

onMounted(async () => {
  let shopUrl = ''
  try {
    const shopSettings = await $fetch<{ shopUrl?: string }>('/shop-settings', {
      baseURL: config.public.apiBase as string
    })
    shopUrl = (shopSettings?.shopUrl || '').replace(/\/+$/, '')
  } catch { /* backend unreachable */ }

  const results: ServiceInfo[] = []

  const endpoints: Array<{ url: string, label: string }> = [
    { url: '/api/version', label: 'Panel' },
    { url: `${config.public.apiBase}`, label: 'Backend' }
  ]
  if (shopUrl) {
    endpoints.push({ url: `${shopUrl}/api/version`, label: 'Shop' })
  }

  await Promise.allSettled(
    endpoints.map(async (ep) => {
      try {
        const data = await $fetch<{ version: string }>(ep.url)
        results.push({
          name: ep.label,
          version: data.version,
          repo: REPO_BY_NAME[ep.label] || ''
        })
      } catch { /* unreachable */ }
    })
  )

  services.value = results

  await Promise.allSettled(
    results.map(async (svc) => {
      if (!svc.repo) return
      try {
        const release = await $fetch<{ tag_name: string }>(
          `https://api.github.com/repos/${svc.repo}/releases/latest`,
          { headers: { Accept: 'application/vnd.github+json' } }
        )
        svc.latestVersion = release.tag_name
        svc.outdated = compareVersions(svc.version, release.tag_name) < 0
      } catch { /* unreachable / no releases */ }
    })
  )

  services.value = [...results]
})

const links = [[{
  label: 'Главная',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Аналитика',
  icon: 'i-lucide-chart-line',
  to: '/analytics',
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
  label: 'Акции',
  icon: 'i-lucide-tag',
  to: '/promotions',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Группы',
  icon: 'i-lucide-layers',
  to: '/groups',
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
    label: 'Сервера',
    badge: 'Beta',
    to: '/settings/servers',
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
            <UTooltip
              v-if="svc.outdated && svc.repo"
              :text="`Доступна новая версия: ${svc.latestVersion}`"
            >
              <NuxtLink
                :to="`https://github.com/${svc.repo}/releases/latest`"
                target="_blank"
                class="flex items-center gap-1 text-warning hover:underline"
              >
                <span>{{ svc.version }}</span>
                <UIcon
                  name="i-lucide-circle-arrow-up"
                  class="size-3"
                />
              </NuxtLink>
            </UTooltip>
            <span
              v-else
              class="text-muted/60"
            >{{ svc.version }}</span>
          </div>
        </div>
        <div
          v-else-if="collapsed && services.length > 0"
          class="flex justify-center items-center py-2 w-full"
        >
          <UTooltip
            :text="services.map(s => s.outdated ? `${s.name} ${s.version} → ${s.latestVersion}` : `${s.name} ${s.version}`).join(' | ')"
          >
            <UButton
              :icon="services.some(s => s.outdated) ? 'i-lucide-circle-arrow-up' : 'i-lucide-info'"
              variant="ghost"
              :color="services.some(s => s.outdated) ? 'warning' : 'neutral'"
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
