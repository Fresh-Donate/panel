export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const client = `panel/${config.public.appVersion}`

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      options.headers.set('X-FD-Client', client)
      if (auth.token) {
        options.headers.set('Authorization', `Bearer ${auth.token}`)
      }
    },
    onResponseError({ response }) {
      if (response.status === 401 && auth.token) {
        nuxtApp.runWithContext(() => auth.logout())
      }
    }
  })

  return {
    provide: { api }
  }
})
