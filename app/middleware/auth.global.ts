export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (to.path !== '/login' && !auth.isAuthenticated) {
    return navigateTo('/login')
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return navigateTo('/')
  }
})
