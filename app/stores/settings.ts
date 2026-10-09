import type { Settings, SettingsPatch } from '~/types'

export const useSettingsStore = defineStore('settings', () => {
  const api = useApi()
  const settings = ref<Settings | null>(null)

  async function load(): Promise<Settings> {
    settings.value = await api<Settings>('/settings')
    return settings.value
  }

  async function ensureLoaded(): Promise<Settings> {
    return settings.value ?? load()
  }

  async function update(patch: SettingsPatch): Promise<Settings> {
    settings.value = await api<Settings>('/settings', { method: 'PUT', body: patch })
    return settings.value
  }

  return { settings, load, ensureLoaded, update }
})
