interface LoginResponse {
  token: string
}

export const useAuthStore = defineStore('auth', () => {
  const nuxtApp = useNuxtApp()
  const token = useCookie<string | null>('auth_token', {
    sameSite: 'strict',
    secure: import.meta.client && window.location.protocol === 'https:'
  })
  const isAuthenticated = computed(() => !!token.value)

  async function login(login: string, password: string) {
    const response = await nuxtApp.$api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { login, password }
    })
    token.value = response.token
  }

  function logout() {
    token.value = null
    return navigateTo('/login')
  }

  return { token, isAuthenticated, login, logout }
})
