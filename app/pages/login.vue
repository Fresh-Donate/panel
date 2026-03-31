<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-center">Вход в панель</h2>
    </template>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <UFormField label="Email">
        <UInput v-model="email" type="email" placeholder="admin@example.com" required />
      </UFormField>

      <UFormField label="Пароль">
        <UInput v-model="password" type="password" placeholder="••••••••" required />
      </UFormField>

      <UButton type="submit" block :loading="loading">
        Войти
      </UButton>
    </form>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const auth = useAuthStore();
const email = ref('');
const password = ref('');
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    navigateTo('/');
  } catch (e: any) {
    console.error('Login failed:', e);
  } finally {
    loading.value = false;
  }
}
</script>
