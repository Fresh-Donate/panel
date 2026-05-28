import type { StatsSummary } from '~/types'

export function useStatsSummary(key: string = 'stats-summary') {
  const summary = useState<StatsSummary | null>(key, () => null)
  const loading = useState<boolean>(`${key}-loading`, () => false)

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
