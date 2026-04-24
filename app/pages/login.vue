<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const toast = useToast()

// `autocomplete` hints let browsers offer to save / autofill the login.
// `type: 'text'` is used instead of `'name'` so the browser treats it as a
// username field (combined with autocomplete="username").
const fields: AuthFormField[] = [{
  name: 'login',
  type: 'text',
  label: 'Логин',
  placeholder: 'Введите логин',
  required: true,
  autocomplete: 'username'
}, {
  name: 'password',
  label: 'Пароль',
  type: 'password',
  placeholder: 'Введите пароль',
  required: true,
  autocomplete: 'current-password'
}]

const schema = z.object({
  login: z.string('Требуется логин'),
  password: z.string('Требуется пароль')
})

type Schema = z.output<typeof schema>

/**
 * Ask the browser to remember the credentials.
 *
 * Chromium-family browsers surface the "Save password?" prompt on a regular
 * `<form>` POST submit, but `UAuthForm` handles the submit with JS (no real
 * navigation), so we nudge them via the Credential Management API. Firefox /
 * Safari ignore this call silently and rely on their own heuristics, which
 * the `autocomplete="username" / "current-password"` attributes on the fields
 * are enough to trigger.
 */
async function rememberCredentials(loginValue: string, password: string) {
  if (typeof window === 'undefined') return
  // PasswordCredential is Chromium-only at time of writing.
  const PasswordCredentialCtor = (window as any).PasswordCredential
  if (!PasswordCredentialCtor || !navigator.credentials?.store) return
  try {
    const cred = new PasswordCredentialCtor({
      id: loginValue,
      password,
      name: loginValue
    })
    await navigator.credentials.store(cred)
  } catch {
    // Non-fatal: the browser may decline (private mode, user rejected, etc.)
  }
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const data = payload.data
  try {
    await auth.login(data.login, data.password)
    await rememberCredentials(data.login, data.password)
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
