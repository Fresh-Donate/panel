<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const api = useApi()
const warnings = ref<string[]>([])

onMounted(async () => {
  const me = await api<{ warnings?: string[] }>('/auth/me').catch(() => null)
  warnings.value = me?.warnings ?? []
})

const examplePassword = computed(() => warnings.value.includes('example_admin_password'))
</script>

<template>
  <div
    v-if="examplePassword"
    class="w-full"
  >
    <div
      v-if="collapsed"
      class="flex justify-center"
    >
      <UTooltip text="Используется пароль администратора по умолчанию">
        <UButton
          icon="i-lucide-shield-alert"
          color="error"
          variant="ghost"
          size="sm"
        />
      </UTooltip>
    </div>
    <UAlert
      v-else
      color="error"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Пароль по умолчанию"
      description="Задайте свой ADMIN_PASSWORD в .env бэкенда и перезапустите его."
    />
  </div>
</template>
