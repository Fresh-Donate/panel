<script setup lang="ts">
import { sub } from 'date-fns'
import type { Period, Range } from '~/types'

const range = shallowRef<Range>({
  start: sub(new Date(), { hours: 24 }),
  end: new Date()
})
const period: Period = 'hourly'

const { summary, load: loadSummary } = useStatsSummary()
watch(
  range,
  () => loadSummary(range.value.start, range.value.end),
  { immediate: true }
)

const weekRange = {
  start: sub(new Date(), { weeks: 1 }),
  end: new Date()
}
const { load: loadWeekSummary } = useStatsSummary('stats-summary-week')
onMounted(() => loadWeekSummary(weekRange.start, weekRange.end))

const currencySymbols: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€'
}

const currencySymbol = computed(() => {
  const code = summary.value?.currency || 'RUB'
  return currencySymbols[code] || code
})

interface QuickAction {
  to: string
  icon: string
  title: string
  description: string
}

const quickActions: QuickAction[] = [
  { to: '/products', icon: 'lucide:package', title: 'Товары', description: 'Создать или изменить' },
  { to: '/promotions', icon: 'lucide:tag', title: 'Акции', description: 'Скидки и промо' },
  { to: '/payments', icon: 'lucide:receipt', title: 'Платежи', description: 'История покупок' },
  { to: '/customers', icon: 'lucide:users', title: 'Клиенты', description: 'База игроков' },
  { to: '/settings', icon: 'lucide:cog', title: 'Настройки', description: 'Изменить настройки FreshDonate' },
  { to: '/shop/settings', icon: 'lucide:store', title: 'Настройки магазина', description: 'Управление страницей магазина' },
  { to: '/analytics', icon: 'lucide:chart-spline', title: 'Аналитика', description: 'Статистика по периодам' },
  { to: '/groups', icon: 'lucide:layers', title: 'Группы', description: 'Создать или изменить' }
]
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Главная">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <HomeStats state-key="stats-summary-week" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeMetricChart
          title="Выручка за день"
          metric="amount"
          :period="period"
          :range="range"
          :formatter="(n) => `${n.toLocaleString('ru-RU')} ${currencySymbol}`"
        />
        <HomeMetricChart
          title="Покупки за день"
          metric="count"
          :period="period"
          :range="range"
          :formatter="(n) => `${n.toLocaleString('ru-RU')} шт.`"
          color="var(--ui-success)"
        />
      </div>

      <div>
        <p class="text-xs text-muted uppercase tracking-wider mb-3">
          Быстрые действия
        </p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="block"
          >
            <UCard
              variant="subtle"
              class="cursor-pointer hover:bg-elevated transition h-full"
            >
              <div class="flex flex-col gap-3">
                <div class="w-8 h-8 flex justify-center items-center rounded-lg bg-primary/10 ring ring-inset ring-primary/25">
                  <Icon
                    :name="action.icon"
                    class="text-xl text-primary"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-highlighted">
                    {{ action.title }}
                  </p>
                  <p class="text-xs text-muted mt-0.5">
                    {{ action.description }}
                  </p>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
