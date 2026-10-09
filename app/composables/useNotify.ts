export function useNotify() {
  const toast = useToast()

  function success(title: string, description?: string, icon = 'i-lucide-check-circle') {
    toast.add({ title, description, icon, color: 'success' })
  }

  function error(title: string, description?: string) {
    toast.add({ title, description, icon: 'i-lucide-alert-circle', color: 'error' })
  }

  function apiError(err: unknown, fallback: string, title = 'Ошибка') {
    error(title, apiErrorMessage(err, fallback))
  }

  return { success, error, apiError }
}
