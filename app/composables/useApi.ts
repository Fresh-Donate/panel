import type { UseFetchOptions } from 'nuxt/app';

export function useApi<T>(url: string, options?: UseFetchOptions<T>) {
  const config = useRuntimeConfig();
  const token = useCookie('auth_token');

  return useFetch<T>(url, {
    baseURL: config.public.apiBase as string,
    headers: {
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
    },
    ...options,
  });
}

export function useApiPost<T>(url: string, body: Record<string, unknown>, options?: UseFetchOptions<T>) {
  return useApi<T>(url, {
    method: 'POST',
    body,
    ...options,
  });
}
