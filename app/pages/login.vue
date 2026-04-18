<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const toast = useToast()

const fields: AuthFormField[] = [{
  name: 'login',
  type: 'name',
  label: 'Логин',
  placeholder: 'Введите логин',
  required: true
}, {
  name: 'password',
  label: 'Пароль',
  type: 'password',
  placeholder: 'Введите пароль',
  required: true
}]

const schema = z.object({
  login: z.string('Требуется логин'),
  password: z.string('Требуется пароль')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const data = payload.data
  try {
    await auth.login(data.login, data.password)
    navigateTo('/')
  } catch (e: any) {
    console.error(e)
    toast.add({ title: 'Ошибка входа', description: e?.data?.message || 'Неверный логин или пароль', color: 'error', icon: 'lucide:shield-alert' })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="FreshDonate"
        description="Введите данные от панели из environment"
        icon="i-lucide-user"
        :fields="fields"
        :submit="{
          label: 'Войти'
        }"
        @submit="onSubmit"
      />
    </UPageCard>
  </div>
</template>
