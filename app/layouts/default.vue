<template>
  <div class="min-h-screen flex bg-default">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-default bg-elevated flex flex-col">
      <div class="p-6">
        <h1 class="text-xl font-bold text-primary">
          FreshDonate
        </h1>
        <p class="text-sm text-muted">
          Admin Panel
        </p>
      </div>

      <nav class="flex-1 px-3 space-y-1">
        <UButton
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          variant="ghost"
          block
          class="justify-start"
        />
      </nav>

      <div class="p-4 border-t border-default">
        <UButton
          icon="i-lucide-log-out"
          label="Выйти"
          variant="ghost"
          block
          class="justify-start"
          @click="auth.logout()"
        />
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()

const navigation = [
  { to: '/', label: 'Дашборд', icon: 'i-lucide-layout-dashboard' },
  { to: '/servers', label: 'Серверы', icon: 'i-lucide-server' },
  { to: '/products', label: 'Товары', icon: 'i-lucide-package' },
  { to: '/payments', label: 'Платежи', icon: 'i-lucide-credit-card' },
  { to: '/settings', label: 'Настройки', icon: 'i-lucide-settings' }
]
</script>
