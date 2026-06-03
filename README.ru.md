# FreshDonate - Админ‑панель

> Панель администратора для управления товарами, платежами, клиентами и настройками сервера.

Часть проекта **FreshDonate** - open‑source платформы донатов для Minecraft‑серверов.
См. также: [Backend](https://github.com/Fresh-Donate/backend) · [Магазин](https://github.com/Fresh-Donate/shop) · [Minecraft‑плагин](https://github.com/Fresh-Donate/fresh-donate-plugin) · [English README](README.md)

---

## О проекте FreshDonate

FreshDonate - самохостимая система приёма донатов для Minecraft‑серверов. Она позволяет продавать привилегии, предметы, валюту и любые другие внутриигровые товары через собственную витрину, принимать оплату через несколько платёжных систем и автоматически доставлять покупки игрокам при следующем заходе на сервер - без комиссий сторонних сервисов и без вендор‑лока.

Платформа разделена на четыре репозитория:

| Репозиторий | Роль |
| --- | --- |
| [fresh-donate-backend](https://github.com/Fresh-Donate/backend) | Fastify API, платежи, вебхуки, очередь доставки |
| [fresh-donate-shop](https://github.com/Fresh-Donate/shop) | Публичная витрина для игроков (Nuxt) |
| **fresh-donate-panel** *(этот)* | Админка для владельца (Nuxt) |
| [fresh-donate-plugin](https://github.com/Fresh-Donate/fresh-donate-plugin) | Плагин Minecraft, выдающий покупки в игре |

## Роль этого репозитория

Админ‑панель - это то, чем пользуется владелец сервера. Она работает с бекендом по тому же REST API, что и магазин, но под админским JWT. Отсюда можно:

- управлять товарами (создание / редактирование / дублирование / удаление);
- настраивать платёжных провайдеров (YooKassa, Heleket) и способы оплаты, которые видит игрок;
- смотреть платежи, подтверждать или повторять доставку вручную;
- смотреть клиентов и их покупки с разбивкой по валютам;
- смотреть дашборд и графики выручки;
- редактировать настройки магазина (брендинг, тексты) и общие настройки (RCON, вебхуки).

## Стек

- **Nuxt 4** (Vue 3)
- **Nuxt UI 4** + **Tailwind CSS 4**
- **Pinia** для состояния, **@vueuse/core** хелперы
- **@unovis/vue** для графиков
- **date-fns**, **zod**
- **TypeScript**

## Требования

- Node.js 20+
- Запущенный [fresh-donate-backend](https://github.com/Fresh-Donate/backend) с учётной записью админа

## Быстрый старт (dev)

```bash
npm install
npm run dev
```

Панель поднимается на `http://localhost:3000` и ожидает бекенд на `http://localhost:3001`. Адреса переопределяются через переменные окружения (`NUXT_PUBLIC_API_BASE` и другие - см. `nuxt.config.ts`).

Стандартные учётные данные админа совпадают с бекендом: `admin` / `admin`. **На проде обязательно поменяй.**

## Production‑сборка

```bash
npm run build
npm run preview     # опционально - локальный preview
```

## Docker

В репозитории есть `Dockerfile` и `docker-compose.yml` для деплоя вместе с бекендом.

```bash
docker compose up -d --build
```

## Структура проекта

```
app/
  app.vue
  app.config.ts
  assets/        стили, изображения
  components/    UI‑компоненты (таблицы, формы, графики, ...)
  composables/   useApi, useAuth, ...
  layouts/       default / auth layouts
  middleware/    auth‑мидлвары
  pages/         dashboard, products, payments, customers, settings, ...
  stores/        Pinia‑сторы (auth, products, ...)
  types/         общие TypeScript‑типы
public/          статические ассеты
server/          Nuxt server routes (если есть)
```

## Скрипты

| Скрипт | Что делает |
| --- | --- |
| `npm run dev` | Dev‑сервер с hot reload |
| `npm run build` | Production‑сборка |
| `npm run generate` | Статическая генерация |
| `npm run preview` | Preview production‑сборки |
| `npm run lint` | ESLint |

## Связанные репозитории

- [fresh-donate-backend](https://github.com/Fresh-Donate/backend) - REST API, которым управляет панель
- [fresh-donate-shop](https://github.com/Fresh-Donate/shop) - публичная витрина
- [fresh-donate-plugin](https://github.com/Fresh-Donate/fresh-donate-plugin) - плагин доставки для Minecraft

## Лицензия

См. [LICENSE](LICENSE).
