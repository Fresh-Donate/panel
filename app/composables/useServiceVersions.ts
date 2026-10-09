interface ServiceInfo {
  name: string
  version: string
  repo: string
  latestVersion?: string
  outdated?: boolean
}

function compareVersions(a: string, b: string): number {
  const norm = (v: string) => v.replace(/^v/i, '').split(/[-+]/)[0] || ''
  const pa = norm(a).split('.').map(n => parseInt(n, 10) || 0)
  const pb = norm(b).split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

export function useServiceVersions() {
  const api = useApi()
  const services = ref<ServiceInfo[]>([])

  async function load() {
    const shopSettings = await api<{ shopUrl?: string }>('/shop-settings').catch(() => null)
    const shopUrl = (shopSettings?.shopUrl || '').replace(/\/+$/, '')

    const sources = [
      { name: 'Panel', repo: 'Fresh-Donate/panel', fetch: () => $fetch<{ version: string }>('/api/version') },
      { name: 'Backend', repo: 'Fresh-Donate/backend', fetch: () => api<{ version: string }>('/') },
      ...(shopUrl ? [{ name: 'Shop', repo: 'Fresh-Donate/shop', fetch: () => $fetch<{ version: string }>(`${shopUrl}/api/version`) }] : [])
    ]

    const versions = await Promise.all(sources.map(s => s.fetch().then(r => r.version).catch(() => null)))
    const found: ServiceInfo[] = sources.flatMap((s, i) => {
      const version = versions[i]
      return version ? [{ name: s.name, repo: s.repo, version }] : []
    })
    services.value = found

    await Promise.all(found.map(async (svc) => {
      const release = await $fetch<{ tag_name: string }>(
        `https://api.github.com/repos/${svc.repo}/releases/latest`,
        { headers: { Accept: 'application/vnd.github+json' } }
      ).catch(() => null)
      if (!release) return
      svc.latestVersion = release.tag_name
      svc.outdated = compareVersions(svc.version, release.tag_name) < 0
    }))
    services.value = [...found]
  }

  return { services, load }
}
