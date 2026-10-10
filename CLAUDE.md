# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

`fresh-donate-panel` — the admin panel of FreshDonate (open-source donation platform for Minecraft servers).
Nuxt 4 SPA (`ssr: false`) talking to `fresh-donate-backend` (Fastify) at `runtimeConfig.public.apiBase`
(`NUXT_PUBLIC_API_BASE`, default `http://localhost:3001`). The only Nitro route is `server/api/version.get.ts`.

## Commands

| Command             | Result                                  |
|---------------------|-----------------------------------------|
| `npm run dev`       | dev server on :3000                     |
| `npm run build`     | production build into `.output/`        |
| `npm run lint`      | ESLint                                  |
| `npm run lint:fix`  | ESLint with autofix — don't format by hand |
| `npm run typecheck` | `nuxt typecheck` (vue-tsc)              |

CI (`.github/workflows/ci.yml`) runs lint + typecheck. There are no tests.
Style: single quotes, no semicolons, no trailing commas, `} else {` on one line (`commaDangle: 'never'`, `braceStyle: '1tbs'`).

## Stack

Nuxt UI 4 (dashboard components: `UDashboardPanel`, `UDashboardNavbar`, …) · Pinia setup stores ·
`@nuxt/icon` with lucide (`i-lucide-*`) · zod for form schemas · date-fns · unovis charts.

## Layout of `app/`

```
app/
├─ plugins/api.ts        # the only $fetch instance that talks to the backend
├─ composables/          # useApi, useNotify, useConfirm, useStatsSummary, useServiceVersions
├─ utils/                # pure helpers: format.ts (money/dates), api-error.ts, datetime.ts
├─ stores/               # auth, settings, products
├─ types/                # one file per domain + shared constants (PAYMENT_STATUSES, PRODUCT_TYPES)
├─ components/
│  ├─ <domain>/          # group/, product/, promotion/, payment-option/, payments/, provider/, settings/, home/
│  ├─ app/               # layout pieces
│  └─ ConfirmModal.vue   # opened through useConfirm()
├─ layouts/              # default (dashboard), auth
├─ middleware/auth.global.ts
└─ pages/
```

Components are path-prefixed: `components/product/FormSlideover.vue` → `<ProductFormSlideover>`.

## Conventions

**API calls.** Always `const api = useApi()` and `api<T>(path, { method, body, query })`. It adds the base URL,
`Authorization` and `X-FD-Client`, and logs out on any 401. Never call `$fetch` with a hand-built
`Authorization` header. Plain `$fetch` is only for third-party origins (shop `/api/version`, GitHub) so the
admin token never leaves the backend. Pass query params through `query`, not string concatenation.

**Errors and toasts.** `const notify = useNotify()`:
`notify.success(title, description?)`, `notify.error(title, description?)`,
`notify.apiError(err, 'Не удалось …', title?)` — shows the backend message when it has one, the fallback otherwise.
No empty `catch {}` around user actions.

**Destructive actions** go through `const confirm = useConfirm()`; `if (!(await confirm({ title, description, confirmLabel }))) return`.
Never `window.confirm`.

**Formatting.** `formatMoney(value, currency, { cents? })`, `formatNumber`, `formatDateTime(iso, { seconds? })`,
`currencySymbol(code)` from `utils/format.ts`. Don't redeclare currency-symbol maps or `toLocaleString` helpers.

**Types.** Response shapes live in `types/`, not inline in pages. Payment status labels/colors: `PAYMENT_STATUSES`.

**Create/edit forms** are one `FormSlideover` per entity: an optional entity prop (`null` = create), state is
rebuilt from it every time the slideover opens, emits `saved`.

**Shared data.** Settings → `useSettingsStore()` (`load`, `ensureLoaded`, `update(patch)`).
Products → `useProductsStore()` (also used by promotions and the group form for names and pickers).

**Pages** keep data loading and wiring; anything with its own form state goes to `components/<domain>/`
(see `components/settings/*Card.vue`). Each settings card owns a slice of `/settings` and saves only that slice.

**UI text** is Russian. Code and comments are English.

**Comments.** Default to none. Leave one short sentence only where the code would surprise a reader.
