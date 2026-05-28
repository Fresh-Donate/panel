import type { StatsSummary } from '~/types'

export function useStatsSummary() {
  const summary = useState<StatsSummary | null>('stats-summary', () => null)
  const loading = useState<boolean>('stats-summary-loading', () => false)

  const config = useRuntimeConfig()
  const token = useCookie('auth_token')

  async function load(from: Date, to: Date, currency?: string) {
    loading.value = true
    const params: Record<string, string> = {
      from: from.toISOString(),
      to: to.toISOString()
    }
    if (currency) params.currency = currency
    try {
      summary.value = await $fetch<StatsSummary>('/stats/summary', {
        baseURL: config.public.apiBase as string,
        headers: { Authorization: `Bearer ${token.value}` },
        params
      })
    } catch {
      summary.value = null
    } finally {
      loading.value = false
    }
  }

  return { summary, loading, load }
}
