import type { StatsFunnel } from '~/types'

export function useStatsFunnel() {
  const funnel = useState<StatsFunnel | null>('stats-funnel', () => null)
  const api = useApi()

  async function load(from: Date, to: Date) {
    try {
      funnel.value = await api<StatsFunnel>('/stats/funnel', {
        query: {
          from: from.toISOString(),
          to: to.toISOString()
        }
      })
    } catch {
      funnel.value = null
    }
  }

  return { funnel, load }
}
