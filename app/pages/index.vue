<script setup lang="ts">
import { sub } from 'date-fns'
import HomeStats from '~/components/home/HomeStats.vue'
import type { Period, Range } from '~/types'

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Home"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip
            text="Notifications"
            :shortcuts="['N']"
          >
            <UButton
              color="neutral"
              variant="ghost"
              square
            >
              <UChip
                color="error"
                inset
              >
                <UIcon
                  name="i-lucide-bell"
                  class="size-5 shrink-0"
                />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <HomeStats
        :period="period"
        :range="range"
      />
      <HomeChart
        :period="period"
        :range="range"
      />
      <HomeSales
        :period="period"
        :range="range"
      />
    </template>
  </UDashboardPanel>
</template>
