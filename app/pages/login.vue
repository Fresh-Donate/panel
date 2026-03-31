<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-center">
        Вход в панель
      </h2>
    </template>

    <form
      class="space-y-4"
      @submit.prevent="handleLogin"
    >
      <UFormField label="Логин">
        <UInput
          v-model="login"
          placeholder="admin"
          required
        />
      </UFormField>

      <UFormField label="Пароль">
        <UInput
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </UFormField>

      <p
        v-if="error"
        class="text-sm text-error"
      >
        {{ error }}
      </p>

      <UButton
        type="submit"
        block
        :loading="loading"
      >
        Войти
      </UButton>
    </form>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const login = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(login.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || 'Неверный логин или пароль'
  } finally {
    loading.value = false
  }
}
</script>
