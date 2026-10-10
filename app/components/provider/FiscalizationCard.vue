<script setup lang="ts">
import type { FiscalizationConfig, PaymentProvider, ProviderConfig } from '~/types'

const props = defineProps<{
  provider: PaymentProvider
}>()

const emit = defineEmits<{
  'update:config': [config: ProviderConfig]
}>()

const ROBOKASSA_SNO = [
  { label: 'ОСН (общая)', value: 'osn' },
  { label: 'УСН доходы', value: 'usn_income' },
  { label: 'УСН доходы минус расходы', value: 'usn_income_outcome' },
  { label: 'ЕСН (сельхоз)', value: 'esn' },
  { label: 'Патент', value: 'patent' }
]

const ROBOKASSA_TAX = [
  { label: 'Без НДС', value: 'none' },
  { label: 'НДС 0%', value: 'vat0' },
  { label: 'НДС 10%', value: 'vat10' },
  { label: 'НДС 20%', value: 'vat20' },
  { label: 'НДС 10/110', value: 'vat110' },
  { label: 'НДС 20/120', value: 'vat120' }
]

const ROBOKASSA_PAYMENT_METHOD = [
  { label: 'Полный расчёт', value: 'full_payment' },
  { label: 'Полная предоплата', value: 'full_prepayment' },
  { label: 'Частичная предоплата', value: 'prepayment' },
  { label: 'Аванс', value: 'advance' },
  { label: 'Частичный расчёт', value: 'partial_payment' },
  { label: 'Передача в кредит', value: 'credit' },
  { label: 'Оплата кредита', value: 'credit_payment' }
]

const ROBOKASSA_PAYMENT_OBJECT = [
  { label: 'Услуга', value: 'service' },
  { label: 'Товар', value: 'commodity' },
  { label: 'Работа', value: 'job' },
  { label: 'Платёж', value: 'payment' },
  { label: 'Подакцизный товар', value: 'excise' },
  { label: 'Результат интеллектуальной деятельности', value: 'intellectual_activity' },
  { label: 'Составной предмет расчёта', value: 'composite' },
  { label: 'Иное', value: 'another' }
]

const YOOKASSA_VAT = [
  { label: '1 - Без НДС', value: 1 },
  { label: '2 - НДС 0%', value: 2 },
  { label: '3 - НДС 10%', value: 3 },
  { label: '4 - НДС 20%', value: 4 },
  { label: '5 - НДС 10/110', value: 5 },
  { label: '6 - НДС 20/120', value: 6 }
]

const YOOKASSA_PAYMENT_MODE = [
  { label: 'Полный расчёт', value: 'full_payment' },
  { label: 'Полная предоплата', value: 'full_prepayment' },
  { label: 'Частичная предоплата', value: 'partial_prepayment' },
  { label: 'Аванс', value: 'advance' },
  { label: 'Частичный расчёт', value: 'partial_payment' },
  { label: 'Передача в кредит', value: 'credit' },
  { label: 'Оплата кредита', value: 'credit_payment' }
]

const YOOKASSA_PAYMENT_SUBJECT = [
  { label: 'Услуга', value: 'service' },
  { label: 'Товар', value: 'commodity' },
  { label: 'Работа', value: 'job' },
  { label: 'Платёж', value: 'payment' },
  { label: 'Подакцизный товар', value: 'excise' },
  { label: 'Результат интеллектуальной деятельности', value: 'intellectual_activity' },
  { label: 'Имущественное право', value: 'property_right' },
  { label: 'Составной предмет расчёта', value: 'composite' },
  { label: 'Иное', value: 'another' }
]

const isRobokassa = computed(() => props.provider.providerId === 'robokassa')

const fiscalization = computed<FiscalizationConfig>(() => props.provider.providerConfig?.fiscalization || {})

const enabled = computed(() => fiscalization.value.enabled === true)

function update(patch: FiscalizationConfig): void {
  const current = props.provider.providerConfig || {}
  const nextFc = { ...fiscalization.value, ...patch }
  emit('update:config', { ...current, fiscalization: nextFc })
}

const defaults = computed<FiscalizationConfig>(() => {
  if (isRobokassa.value) {
    return {
      sno: 'usn_income',
      tax: 'none',
      paymentMethod: 'full_payment',
      paymentObject: 'service'
    }
  }
  return {
    vatCode: 1,
    paymentMode: 'full_payment',
    paymentSubject: 'service'
  }
})

function setEnabled(value: boolean): void {
  if (value) {
    update({ ...defaults.value, ...fiscalization.value, enabled: true })
  } else {
    update({ enabled: false })
  }
}
</script>

<template>
  <UPageCard
    title="Фискализация (54-ФЗ)"
    description="Чек уходит в онлайн-кассу провайдера, а оттуда в ФНС и покупателю на email."
  >
    <div class="space-y-4">
      <UFormField label="Передавать чек">
        <USwitch
          :model-value="enabled"
          @update:model-value="setEnabled($event as boolean)"
        />
      </UFormField>

      <template v-if="enabled && isRobokassa">
        <UFormField
          label="Система налогообложения"
          description="Должна совпадать с СНО, указанной в кабинете Robokassa."
        >
          <USelect
            :model-value="fiscalization.sno || defaults.sno"
            :items="ROBOKASSA_SNO"
            class="w-full max-w-lg"
            @update:model-value="update({ sno: $event })"
          />
        </UFormField>

        <UFormField
          label="Ставка НДС"
          description="«Без НДС» - для ИП на УСН или патенте."
        >
          <USelect
            :model-value="fiscalization.tax || defaults.tax"
            :items="ROBOKASSA_TAX"
            class="w-full max-w-lg"
            @update:model-value="update({ tax: $event })"
          />
        </UFormField>

        <UFormField
          label="Признак способа расчёта"
          description="Для донат-магазина обычно «Полный расчёт»."
        >
          <USelect
            :model-value="fiscalization.paymentMethod || defaults.paymentMethod"
            :items="ROBOKASSA_PAYMENT_METHOD"
            class="w-full max-w-lg"
            @update:model-value="update({ paymentMethod: $event })"
          />
        </UFormField>

        <UFormField
          label="Признак предмета расчёта"
          description="«Услуга» - для виртуальных привилегий, «Товар» - для физических вещей."
        >
          <USelect
            :model-value="fiscalization.paymentObject || defaults.paymentObject"
            :items="ROBOKASSA_PAYMENT_OBJECT"
            class="w-full max-w-lg"
            @update:model-value="update({ paymentObject: $event })"
          />
        </UFormField>
      </template>

      <template v-else-if="enabled">
        <UFormField
          label="Код НДС"
          description="Должен совпадать с настройками онлайн-кассы в кабинете ЮKassa. «Без НДС» - для ИП на УСН."
        >
          <USelect
            :model-value="fiscalization.vatCode ?? defaults.vatCode"
            :items="YOOKASSA_VAT"
            value-key="value"
            class="w-full max-w-lg"
            @update:model-value="update({ vatCode: Number($event) })"
          />
        </UFormField>

        <UFormField
          label="Способ расчёта"
          description="Для донат-магазина обычно «Полный расчёт»."
        >
          <USelect
            :model-value="fiscalization.paymentMode || defaults.paymentMode"
            :items="YOOKASSA_PAYMENT_MODE"
            class="w-full max-w-lg"
            @update:model-value="update({ paymentMode: $event })"
          />
        </UFormField>

        <UFormField
          label="Предмет расчёта"
          description="«Услуга» - для виртуальных привилегий, «Товар» - для физических вещей."
        >
          <USelect
            :model-value="fiscalization.paymentSubject || defaults.paymentSubject"
            :items="YOOKASSA_PAYMENT_SUBJECT"
            class="w-full max-w-lg"
            @update:model-value="update({ paymentSubject: $event })"
          />
        </UFormField>

        <UAlert
          icon="i-lucide-info"
          color="info"
          variant="subtle"
          title="Email покупателя обязателен"
          description="Без email чек не отправится, но оплата пройдёт."
        />
      </template>

      <UAlert
        v-if="!enabled"
        icon="i-lucide-triangle-alert"
        color="warning"
        variant="subtle"
        title="Включите, если в кабинете провайдера подключена онлайн-касса"
        description="Иначе провайдер пришлёт уведомление о нарушении 54-ФЗ и может заблокировать выплаты."
      />
    </div>
  </UPageCard>
</template>
