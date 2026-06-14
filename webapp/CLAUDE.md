# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: CodeSail Web Admin (码上启航 管理后台)

Web-based operations dashboard for the CodeSail platform. Used by content operators to manage knowledge content, configure operations, run AI content generation, review user notes, and monitor analytics.

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 19 + TypeScript | Vite 6 build |
| UI Library | Ant Design 6.x | `antd` ^6.4.3, `@ant-design/icons` ^6.2.3 |
| Styling | Tailwind CSS 4 | `@tailwindcss/vite` plugin, `@theme` tokens in CSS |
| State (server) | TanStack React Query | staleTime 5min, gcTime 30min, retry 2 |
| State (client) | Zustand + persist | authStore (token), themeStore (dark/light) |
| Routing | React Router 7 | `createBrowserRouter`, lazy-loaded pages, AuthGuard |
| Forms | React Hook Form + Zod 4 | `@hookform/resolvers` |
| Charts | ECharts 6 | `echarts-for-react` wrapper |
| Rich Text | Tiptap 3 | starter-kit + image + link + placeholder extensions |
| Drag & Drop | @dnd-kit | core + sortable + utilities |
| HTTP | Axios | Interceptors: Bearer token injection, 401 → redirect login |
| Font | Inter | `@fontsource/inter` 400/500/600/700 |
| Date | dayjs | Lightweight date formatting |
| Path alias | `@/` → `src/` | Vite + tsconfig alias |

## Commands

```bash
cd memo/webapp
npm run dev        # Dev server on :3000, proxy /api → localhost:8080
npm run build      # tsc --noEmit + vite build
npm run lint       # ESLint on src/ (--ext .ts,.tsx)
npm run typecheck  # tsc --noEmit
npm run test       # Vitest run (jsdom)
npm run test:watch # Vitest watch mode
```

## Project Structure

```
webapp/
├── project.md                 # Project overview + milestones
├── README.md                  # Project README
├── designs/
│   └── codesail-admin.pen     # Pixso design source
├── docs/
│   ├── PRD.md                 # Product requirements v1.3
│   ├── 技术可行性分析报告.md    # Technical feasibility + architecture
│   ├── 前端技术开发指导及规范.md # Frontend dev standards
│   └── 交互设计.md            # Design tokens + interaction spec
├── src/
│   ├── main.tsx               # Entry point (StrictMode + App)
│   ├── App.tsx                # Provider hierarchy: ErrorBoundary → ConfigProvider → AntApp → QueryClientProvider → RouterProvider
│   ├── vite-env.d.ts
│   ├── api/                   # 19 API modules (see below)
│   ├── components/common/     # 9 reusable components
│   ├── layouts/AdminLayout/   # Sidebar, Header, index.tsx
│   ├── pages/                 # 18 page directories (see below)
│   ├── routes/                # index.tsx (router), AuthGuard.tsx, routePaths.ts
│   ├── stores/                # authStore.ts, themeStore.ts
│   ├── styles/                # index.css (Tailwind + theme tokens), antd-theme.ts
│   ├── types/                 # 18 type definition files
│   └── utils/                 # constants.ts, format.ts
├── tests/
│   ├── setup.ts               # @testing-library/jest-dom
│   └── components/            # Example test
├── index.html                 # zh-CN entry, "码上启航 — 管理后台"
├── vite.config.ts             # React + Tailwind plugins, @ alias, proxy /api → :8080
├── vitest.config.ts           # jsdom environment, globals, CSS support
├── tsconfig.json              # Strict, ES2020, bundler, react-jsx
├── .eslintrc.cjs              # @typescript-eslint + react-hooks + react-refresh
└── .prettierrc                # no semi, single quote, trailing comma, printWidth 100
```

## Application Shell

### Provider Hierarchy (`App.tsx`)
```
ErrorBoundary
  → ConfigProvider (Ant Design theme, zh_CN locale)
    → AntApp (message/modal via useApp())
      → QueryClientProvider (staleTime 5min, retry 2)
        → RouterProvider (createBrowserRouter)
```

### Routing (`routes/index.tsx`)
- `/login` → LoginPage (no auth guard)
- `/` → AuthGuard → AdminLayout (Sidebar + Header + Outlet)
  - `/dashboard` (index redirect target)
  - `/ai/cards`, `/ai/questions`, `/ai/review`, `/ai/sensitive-words`
  - `/content/domains`, `/content/domains/:id/chapters`, `/content/cards`, `/content/questions`
  - `/operation/points`, `/operation/unlock`, `/operation/homepage`, `/operation/badges`, `/operation/ads`, `/operation/review`
  - `/analytics/overview` (all analytics sub-pages redirect here, unified tab view)
  - `/users`, `/users/:id`
  - `/system/password`, `/system/logs`
- `*` → NotFoundPage (404)

All pages are lazy-loaded (`React.lazy` + `Suspense`).

### Auth Guard (`routes/AuthGuard.tsx`)
- Waits for Zustand persist hydration
- Redirects to `/login` if no token; renders `<Outlet />` if authenticated

### Layout (`layouts/AdminLayout/`)
- **Sidebar:** 240px dark-themed Sider, Ant Menu with 7 top-level items + nested children, auto-open based on route, brand header "码上启航"
- **Header:** Auto-generated breadcrumbs, theme toggle (Sun/Moon), user dropdown (修改密码, 退出登录)

## Stores

| Store | Key State | Persist Key |
|-------|-----------|-------------|
| `authStore` | token, username, isAuthenticated; actions: login(), logout() | `codesail-auth` |
| `themeStore` | mode ('light'/'dark'); action: toggle() | `codesail-theme` |

## API Layer

### Client (`api/client.ts`)
- Axios instance: `baseURL: /api/v1`
- **Request interceptor:** Injects `Authorization: Bearer <token>` from authStore
- **Response interceptor:** On 401 → clear token → redirect to `/login`

### API Modules (19 files, all currently use mock data)

| Module | Endpoints | Purpose |
|--------|-----------|---------|
| `auth.ts` | login, changePassword | Admin authentication |
| `ai.ts` | searchCards, generateQuestion | AI workbench helpers |
| `cards.ts` | generateCards, getHistory, getChapters | AI card generation |
| `cards-content.ts` | getList, update, toggle, delete | Knowledge cards CRUD |
| `domains.ts` | getList, create, update, toggle, reorder, delete | Domain management |
| `chapters.ts` | getList, create, update, toggle, reorder, delete | Chapter management |
| `questions.ts` | getList, update, toggle, delete | Question bank |
| `review.ts` | getStats, getPendingList, getReviewRecords, batchReview, getReviewDetail | Note review |
| `sensitive-words.ts` | getList, create, update, toggle, delete, batchDelete | Sensitive word library |
| `banner.ts` | getList, create, update, toggle, reorder, delete | Banner management |
| `points.ts` | getList, update, getChangeLogs | Points config |
| `badges.ts` | getList, create, update, toggle, delete | Achievement badges |
| `ads.ts` | getConfig, updateConfig | Ad configuration |
| `unlock.ts` | getList, update, batchUpdate | Domain unlock config |
| `review-config.ts` | getPlans, getDefaultConfig, updateDefaultConfig, resetDefaultConfig, setDefaultPlan | Review defaults |
| `analytics.ts` | getDashboardStats, getOverviewStats, getUserGrowthTrend, getDomainHeat, getCardLearningRank, getQuestionAccuracy, getUserGrowth, getActivityDistribution, getLearningFunnel, getPointsTrend, getAdStats, getPointsDistribution | Data dashboard |
| `users.ts` | getList, getDetail | User management |
| `logs.ts` | getList | Operation logs |

**Important:** All API modules currently return in-memory mock data with `delay()` to simulate latency. This means the app works standalone for UI development. Real backend integration requires replacing mock data with actual HTTP calls.

## Pages (18, all with mock data shells)

| Section | Pages |
|---------|-------|
| **Login** | Login form (brand gradient bg, username/password, card layout 400px) |
| **Dashboard** | Workbench: StatCards, QuickActions, RecentOperations |
| **AI Workbench** | AI Cards (topic input + generated preview + history), AI Questions (card search + generation), AI Review (stats + queue + detail modal + batch actions), Sensitive Words (CRUD + match modes) |
| **Content** | Domains (CRUD + sorting), Chapters (grouped by domain), Cards (filters + form modal + toggle), Questions (CRUD + 4 options + correct answer) |
| **Operation** | Points (rules + change log), Unlock (domain pricing), Homepage (Banner CRUD + reorder), Badges (CRUD + toggle), Ads (splash toggle), Review (default config) |
| **Analytics** | Overview (tabbed: core metrics, content, users, points/ads — all with ECharts) |
| **Users** | List (paginated, searchable), Detail (info + learning records + point records) |
| **System** | Password change, Operation logs (paginated, filterable) |

## Common Components (9)

| Component | Purpose |
|-----------|---------|
| `ConfirmDelete` | Delete confirmation with input verification |
| `DataTable` | Generic data table wrapper |
| `EmptyState` | Empty placeholder |
| `ErrorBoundary` | React error boundary |
| `LoadingSkeleton` | Skeleton loading |
| `PageHeader` | Page title with actions |
| `RiskScoreBadge` | AI risk score badge (low/medium/high) |
| `StatCard` | Metric card (value, label, trend) |
| `StatusBadge` | Status indicator |

## Design Tokens

Defined in `src/styles/index.css` (`@theme` directive) and `src/styles/antd-theme.ts` (Ant ThemeConfig):

| Token | Value |
|-------|-------|
| Primary | `#160C57` (deep purple) |
| Primary Light | `#2D1A8E` |
| Primary Dark | `#0E0836` |
| Secondary | `#6366F1` (Indigo) |
| CTA | `#F97316` (Orange) |
| Success | `#10B981` / Danger: `#EF4444` / Warning: `#F59E0B` / Info: `#0EA5E9` |
| Border Radius | sm 4px, md 8px, lg 12px |
| Font | Inter (400/500/600/700) |

## Current Status

**Project scaffolded with mock data.** All pages, components, stores, routes, and API modules are built and functional with in-memory mock data. The app can run standalone at `localhost:3000` for UI development and testing.

Pending work:
- Replace mock data in API modules with real HTTP calls to backend
- Implement custom hooks (`src/hooks/` does not exist yet)
- Real AI content streaming
- Real data visualization connections
- End-to-end integration testing with backend

## Context Loading (Required Before Development)

1. `memo/webapp/project.md` — Project overview, milestones, core principles
2. `memo/webapp/docs/技术可行性分析报告.md` — Technical decisions and architecture
3. `memo/webapp/docs/前端技术开发指导及规范.md` — Frontend dev standards and conventions
4. `memo/CLAUDE.md` — Project-level Claude Code dev rules

## Coding Standards

From `docs/前端技术开发指导及规范.md`:
- **Naming:** PascalCase components, camelCase files/variables, UPPER_SNAKE_CASE constants
- **Imports order:** external libs → internal modules → styles
- **Types:** `interface` for objects, `type` for unions/utilities; `z.infer<typeof schema>` for forms
- **Components:** Container/Presentational pattern; single responsibility
- **Git:** Conventional Commits: `type(scope): subject` (scopes: ai, content, operation, analytics, user, system, layout, common, config)

## Boundaries

- Pure frontend project — never modify backend/miniapp/test code
- Strictly follow backend API contract — report mismatches, don't adapt frontend
- API response format: `{code, message, data, meta}` per `backend/shared/responses.py`
- Auth: JWT Bearer token, 24h expiry, refresh via `/api/v1/auth/refresh`
- UI design: PRD functional requirements + design tokens in `src/styles/`
