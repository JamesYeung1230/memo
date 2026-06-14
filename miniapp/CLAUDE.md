# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: CodeSail WeChat MiniApp (码上启航 小程序)

AI programming knowledge learning mini-program for non-professional programmers. C-end user app using knowledge cards + quiz + spaced repetition + points system.

## Tech Stack

- **Framework:** WeChat native + Skyline rendering engine + glass-easel component framework
- **No npm/CLI build** — native WeChat toolchain, no package.json
- **Dev tool:** WeChat DevTools (open `miniapp/` directory to preview/debug)
- **Design:** Pixso `.pen` source file at `designs/CodeSail.pen`

## Commands

No CLI build commands. Development workflow:

1. Open WeChat DevTools
2. Open project at `d:\workspace\memo\miniapp\`
3. Preview/debug in simulator
4. Use `config/env.js` to switch between DEV and PROD API environments

## Architecture

```
miniapp/
├── app.js              # Entry: login check, theme loading, token management
├── app.json            # 37 page routes, custom tabBar, window config
├── app.wxss            # Global design tokens (CSS variables: colors, fonts, radii, shadows)
├── config/env.js       # API environment (DEV → VM, PROD → api.codesail.cn)
├── api/                # API modules (one file per domain)
│   ├── auth.js         # WeChat login, token refresh (→ Auth :8001)
│   ├── learn.js        # Domains, chapters, cards, quiz, review (→ Core :8000)
│   ├── notes.js        # Notes CRUD, submit/withdraw review, share (→ Core :8000)
│   └── points.js       # Balance, records, achievements, unlock, ad watch (→ Core :8000)
├── utils/request.js    # HTTP wrapper (wx.request + Promise, auto token refresh on 401)
├── pages/              # 37 pages in 6 categories
├── components/         # 18 reusable components
├── custom-tab-bar/     # 5-tab custom bottom navigation
└── docs/               # PRD, 交互设计, 审核重新提交说明
```

### Global Data (app.js)

| Field | Purpose |
|-------|---------|
| `token` / `refreshToken` | JWT from login, persisted to storage |
| `userInfo` | WeChat user info |
| `isLoggedIn` | Login state flag |
| `themeColor` | Primary theme color (#4A90D9 default, overridable by admin) |

On launch: `checkLoginStatus()` → loads token from storage; `fetchThemeConfig()` → loads cached theme.

### API Layer (utils/request.js)

- Wraps `wx.request` with Promise
- Auto-attaches `Authorization: Bearer <token>` when `needAuth=true`
- **Token refresh:** on 401, auto-refreshes via `/wechat/refresh`, retries original request
- **Concurrent refresh prevention:** single shared `refreshPromise`
- Two service bases: `auth` (8001) and `core` (8000)
- Convenience: `get()`, `post()`, `put()`, `del()`

### API Response Unwrapping

`request.js` resolves `{code, data, meta}` → callbacks receive `res.data`, NOT `res` directly. The `paginated()` helper returns data as array, total in `meta.total`.

## Pages (37 total, all 🟢 complete)

### Home (1)
| Page | Path | Purpose |
|------|------|---------|
| home | `pages/home/home` | Dashboard: progress ring, review entry, recommended card, daily challenge, quick note, points, ad |

### Login (1)
| Page | Path | Purpose |
|------|------|---------|
| login | `pages/login/login` | WeChat login with privacy agreement, auto-redirect if logged in |

### Learn (17)
| Page | Purpose |
|------|---------|
| learn | Domain list + overview stats |
| knowledge-tree | Domain-chapter tree navigation |
| card-browse | Chapter card list with search/filter |
| card-detail | Full card view (concept, description, analogy, quiz, share) |
| chapter-progress | Chapter progress labels |
| quiz | Quiz mode (fetch questions, submit answers, feedback) |
| quiz-result | Animated score display |
| quiz-analysis | Single question analysis |
| daily-challenge | Daily challenge batch answer |
| challenge-result | Challenge result with points earned |
| error-book | Wrong question list |
| error-review | Wrong question practice |
| quiz-stats | Quiz statistics dashboard |
| review-today | Today's spaced repetition review |
| note-review | Review-associated notes |
| review-settings | Ebbinghaus review plan config |

### Notes (4)
| Page | Purpose |
|------|---------|
| notes | Note list with filters, search, pagination |
| note-editor | Create/edit note (title, content, tags, card link) |
| note-detail | Full note with audit status, action buttons |
| note-share | Share preview (truncated title 20 + content 50 chars) |

### Points (6)
| Page | Purpose |
|------|---------|
| points | Points dashboard, ad watch, store/achievement preview |
| points-detail | Transaction history with filter tabs |
| unlock-shop | Knowledge domain unlock store |
| unlock-confirm | Unlock confirmation with cost |
| achievements | Badge wall |
| achievement-detail | Single badge detail |

### Profile (8)
| Page | Purpose |
|------|---------|
| profile | User profile, stats, menu navigation |
| study-stats | Detailed learning statistics |
| favorites | Favorited cards list |
| calendar | Check-in calendar (month navigation) |
| audit-history | Note audit status history |
| settings | Settings menu entry |
| memory-settings | Memory/review config (intervals, limits, silent mode) |
| home-settings | Home module visibility/reorder |
| general-settings | Theme color picker, cache, about, logout |

## Components (18, all 🟢 complete)

| Component | Purpose |
|-----------|---------|
| navigation-bar | Full-featured custom nav bar (slots, back, loading, safe area) |
| nav-bar | Simplified nav bar (center/back modes, statusBarHeight) |
| tab-bar | 5-tab bottom bar with slide animation |
| knowledge-card | Card display: title, concept, tags, expand/collapse, actions |
| progress-ring | Canvas circular progress with animated percent |
| progress-bar | Linear progress bar, animated |
| empty-state | Empty placeholder (icon, message, action button) |
| loading-skeleton | Skeleton screen |
| loading-spinner | Loading spinner |
| toast | Toast notification (success/warning/error/info, auto-dismiss) |
| tag | Simple tag/chip |
| badge | Notification badge (dot/number, maxCount overflow) |
| swipe-action | Swipe-to-reveal actions (touch gesture) |
| modal | Centered modal dialog (animations, 500ms debounce) |
| search-bar | Search input with clear/cancel |
| quiz-option | Quiz option (letter + text, selected/correct/wrong states) |
| status-dot | Audit status indicator (draft/pending/approved/rejected) |
| button | Unified button (primary/secondary, loading/disabled states) |

## Common Debug Checklist

When pages show no data, clicks don't work, or navigation fails:

1. **Page path registration** — URL in navigation must match `app.json` exactly. Watch for duplicated directory names.
2. **API response unwrapping** — Frontend accesses `res.data`, not `res`. `paginated()` returns array in data, total in `meta.total`.
3. **Field name alignment** — Common mismatches: `question_text` vs `question`/`content`, `options` as object vs array, `question_id` vs `id`, `points_earned` vs `points`.
4. **WXML event passing** — Use `mark:` prefix across component boundaries: `mark:question-idx="{{index}}"` → read with `e.mark['question-idx']`. Always use `wx:for-index="qIdx"` for nested loops.
5. **CSS layout constraints** — `flex: 1` scroll-view needs fixed height: `.page-wrapper { height: 100vh; overflow: hidden; }` + `.scroll-view { flex: 1; min-height: 0; }`.

## Key Conventions

- **API env:** `config/env.js` — currently PROD (`https://api.codesail.cn`)
- **Guest mode:** Not logged in → limited functionality, login prompt on actions
- **Theme:** Default #4A90D9 (tech blue), overridable by admin theme config, live reload
- **Design tokens:** CSS variables in `app.wxss` (--color-primary, --radius-lg: 30rpx, --shadow-*, etc.)
- **Notes are local-first** — only uploaded on explicit "submit review" action

## Context Loading

Before working on miniapp, load:
1. `memo/miniapp/project.md` — Project overview, milestones, constraints
2. `memo/miniapp/tasks.md` — Page/component completion status
3. `memo/CLAUDE.md` — Project-level dev rules

## Boundaries

- Pure frontend project — never modify backend/webapp/test code
- Follow backend API contract strictly — report mismatches, don't adapt frontend
- Design source: `designs/CodeSail.pen` (Pixso, accessible via Pencil MCP)
- Use WeChat DevTools for preview/debug, not browser
