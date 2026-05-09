import type { UseFetchOptions } from 'nuxt/app'

export function useApi<T>(url: string, options?: UseFetchOptions<T>) {
  const config = useRuntimeConfig()
  const token = useCookie('auth_token')
  const version = (config.public.appVersion as string) || '0.0.0'

  return useFetch<T>(url, {
    baseURL: config.public.apiBase as string,
    headers: {
      'X-FD-Client': `panel/${version}`,
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
    },
    ...options as any
  })
}

export function useApiPost<T>(url: string, body: Record<string, unknown>, options?: UseFetchOptions<T>) {
  return useApi<T>(url, {
    method: 'POST',
    body,
    ...options
  })
}
