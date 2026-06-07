# FreshDonate - Admin Panel

> Admin dashboard for managing products, payments, customers and server settings.

Part of the **FreshDonate** open‑source donation platform for Minecraft servers.
See also: [Backend](https://github.com/Fresh-Donate/backend) · [Shop](https://github.com/Fresh-Donate/shop) · [Minecraft Plugin](https://github.com/Fresh-Donate/fresh-donate-plugin) · [Russian README](README.ru.md)

---

## About FreshDonate

FreshDonate is a self‑hosted donation system for Minecraft servers. It lets you sell ranks, items, currency and any other in‑game goods through your own storefront, accept payments via multiple providers, and deliver purchases to players automatically the next time they are online - without any third‑party commission or lock‑in.

The platform is split into four repositories:

| Repository | Role |
| --- | --- |
| [fresh-donate-backend](https://github.com/Fresh-Donate/backend) | Fastify API, payments, webhooks, delivery queue |
| [fresh-donate-shop](https://github.com/Fresh-Donate/shop) | Public storefront for players (Nuxt) |
| **fresh-donate-panel** *(this repo)* | Admin panel for owners (Nuxt) |
| [fresh-donate-plugin](https://github.com/Fresh-Donate/fresh-donate-plugin) | Minecraft plugin that delivers purchases in‑game |

## Role of this repository

The admin panel is what the server owner uses. It talks to the backend over the same REST API as the shop, but with an admin JWT. From here you can:

- manage products (create / edit / duplicate / delete);
- configure payment providers (YooKassa, Heleket) and payment options shown to players;
- view payments, confirm or retry delivery manually;
- browse customers and their purchase history with per‑currency stats;
- see dashboard stats and revenue charts;
- edit shop settings (branding, copy) and global settings (RCON, webhooks).

## Tech stack

- **Nuxt 4** (Vue 3)
- **Nuxt UI 4** + **Tailwind CSS 4**
- **Pinia** for state, **@vueuse/core** helpers
- **@unovis/vue** for charts
- **date-fns**, **zod**
- **TypeScript**

## Requirements

- Node.js 20+
- A running [fresh-donate-backend](https://github.com/Fresh-Donate/backend) with admin credentials

## Quick start (dev)

```bash
npm install
npm run dev
```

The panel starts on `http://localhost:3000` and expects the backend on `http://localhost:3001`. Override via environment variables (`NUXT_PUBLIC_API_BASE` and friends - see `nuxt.config.ts`).

Default admin credentials match the backend: `admin` / `admin`. **Change them in production.**

## Build / production

```bash
npm run build
npm run preview     # optional local preview
```

## Docker

`Dockerfile` and `docker-compose.yml` are included for deployment alongside the backend.

```bash
docker compose up -d --build
```

## Project structure

```
app/
  app.vue
  app.config.ts
  assets/        styles, images
  components/    UI components (tables, forms, charts, ...)
  composables/   useApi, useAuth, ...
  layouts/       default / auth layouts
  middleware/    auth guards
  pages/         dashboard, products, payments, customers, settings, ...
  stores/        Pinia stores (auth, products, ...)
  types/         shared TypeScript types
public/          static assets
server/          Nuxt server routes (if any)
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run generate` | Static site generation |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Related repositories

- [fresh-donate-backend](https://github.com/Fresh-Donate/backend) - REST API this panel manages
- [fresh-donate-shop](https://github.com/Fresh-Donate/shop) - public storefront
- [fresh-donate-plugin](https://github.com/Fresh-Donate/fresh-donate-plugin) - Minecraft delivery plugin

## License

See [LICENSE](LICENSE).
