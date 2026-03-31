export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string, login: string, role: string } | null>(null)
  const token = useCookie('auth_token')
  const isAuthenticated = computed(() => !!token.value)

  async function login(login: string, password: string) {
    const config = useRuntimeConfig()
    const response = await $fetch<{ token: string, user: { id: string, login: string, role: string } }>(
      '/auth/login',
      {
        baseURL: config.public.apiBase as string,
        method: 'POST',
        body: { login, password }
      }
    )

    token.value = response.token
    user.value = response.user
  }

  function logout() {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  return { user, token, isAuthenticated, login, logout }
})
