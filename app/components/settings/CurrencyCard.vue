<script setup lang="ts">
import type { Currency, Settings } from '~/types'

const props = defineProps<{
  settings: Settings
}>()

const store = useSettingsStore()
const notify = useNotify()

const SUPPORTED_CURRENCIES: Currency[] = ['RUB', 'USD', 'EUR']

// keep in sync with backend defaultRatesFor
const DEFAULT_RATES_BY_BASE: Record<Currency, Record<string, number>> = {
  RUB: { USD: 95, EUR: 100 },
  USD: { RUB: 0.0105, EUR: 1.05 },
  EUR: { RUB: 0.01, USD: 0.95 }
}

const baseCurrency = ref<Currency>(props.settings.base_currency || 'RUB')
const rates = ref<Record<string, number>>({ ...props.settings.currency_rates })
const saving = ref(false)

const baseCurrencyItems = SUPPORTED_CURRENCIES.map(c => ({ label: c, value: c }))
const rateCurrencies = computed(() => SUPPORTED_CURRENCIES.filter(c => c !== baseCurrency.value))

function setBaseCurrency(newBase: Currency) {
  if (newBase === baseCurrency.value) return
  baseCurrency.value = newBase
  rates.value = { ...DEFAULT_RATES_BY_BASE[newBase] }
}

async function save() {
  saving.value = true
  try {
    const payload: Record<string, number> = {}
    for (const code of rateCurrencies.value) {
      const rate = Number(rates.value[code])
      if (Number.isFinite(rate) && rate > 0) payload[code] = rate
    }
    const data = await store.update({ base_currency: baseCurrency.value, currency_rates: payload })
    baseCurrency.value = data.base_currency
    rates.value = { ...data.currency_rates }
    notify.success('Настройки валют сохранены')
  } catch (err) {
    notify.apiError(err, 'Не удалось сохранить настройки валют.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Валюты"
    description="Базовая валюта и курсы конвертации. Используются для пересчёта статистики и сортировок (например, по сумме покупок)."
  >
    <div class="space-y-6">
      <UFormField
        label="Базовая валюта"
        description="К ней приводятся все суммы при вычислениях. При смене валюты курсы будут пересозданы со значениями по умолчанию."
      >
        <USelectMenu
          :model-value="baseCurrency"
          :items="baseCurrencyItems"
          value-key="value"
          class="w-full max-w-xs"
          @update:model-value="setBaseCurrency"
        />
      </UFormField>

      <USeparator />

      <UFormField
        label="Курсы валют"
        :description="`Сколько ${baseCurrency} в одной единице валюты.`"
      >
        <div class="space-y-2 max-w-lg">
          <div
            v-for="code in rateCurrencies"
            :key="code"
            class="flex items-center gap-3"
          >
            <span class="w-16 font-mono text-sm">1 {{ code }}</span>
            <span class="text-muted text-sm">=</span>
            <UInput
              v-model.number="rates[code]"
              type="number"
              step="0.0001"
              min="0"
              class="flex-1"
            />
            <span class="w-12 font-mono text-muted text-sm">{{ baseCurrency }}</span>
          </div>
        </div>
      </UFormField>

      <USeparator />

      <div>
        <UButton
          label="Сохранить"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </div>
  </UPageCard>
</template>
