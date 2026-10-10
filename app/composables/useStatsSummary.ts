import type { StatsSummary } from '~/types'

export function useStatsSummary(key: string = 'stats-summary') {
  const summary = useState<StatsSummary | null>(key, () => null)
  const loading = useState<boolean>(`${key}-loading`, () => false)
  const api = useApi()

  async function load(from: Date, to: Date, currency?: string) {
    loading.value = true
    try {
      summary.value = await api<StatsSummary>('/stats/summary', {
        query: {
          from: from.toISOString(),
          to: to.toISOString(),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          currency
        }
      })
    } catch {
      summary.value = null
    } finally {
      loading.value = false
    }
  }

  return { summary, loading, load }
}
