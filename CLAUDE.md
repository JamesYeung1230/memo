# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: 码上启航 (CodeSail)

An AI programming knowledge learning platform for non-professional programmers. Knowledge cards + quiz + spaced repetition.

```
miniapp (WeChat, C-end users)     webapp (React 19 admin, B-end operators)
        │                                        │
        └──────────────┬─────────────────────────┘
                       │ HTTPS / REST
                       ▼
           backend (FastAPI microservices)
           Auth:8001 / Knowledge:8002 / Core:8000
           PostgreSQL 16 + Redis 7
```

**Production:** `https://api.codesail.cn` (Tencent Cloud `49.233.10.92`)  
**Dev VM:** `peng@192.168.234.128` (SSH key: `backend/.ssh/vm_key`, remote path: `/home/peng/memo/backend`)  
**Repo:** https://github.com/JamesYeung1230/memo | **Branch:** `develop` (working), `master` (main)

---

模型选择和通用 Git/工作流规则遵循全局 `~/.claude/CLAUDE.md`。本文件仅补充项目特定约束。

---

## Critical Rules

### Module Isolation (NEVER cross-edit)
| Working on | Can edit | Must not touch |
|-----------|----------|----------------|
| backend | `backend/` | `miniapp/` `webapp/` `test/` |
| miniapp | `miniapp/` | `backend/` `webapp/` `test/` |
| webapp | `webapp/` | `backend/` `miniapp/` `test/` |

Cross-project edits only allowed during integration phase after all code is written.

### Design Conflicts
Found a design flaw or interface mismatch? **Never fix in code directly.** Report to user → propose solution → get confirmation → update design docs → then code.

### Git Rules
- **Commit locally after every milestone**（禁止多个 milestone 合并为一次提交）
- Pre-commit checklist: all tests pass, coverage ≥90% (backend), milestone docs updated

### Milestone Update (after every module)
Must sync these 6 files using 🟢/🔴/🟡/⚪ status:

| File | What to update |
|------|---------------|
| `开发计划.md` | §六 Module completion table |
| `backend/project.md` | Development milestone tables |
| `backend/tasks.md` | Task list + status summary |
| `miniapp/project.md` | Development milestone table |
| `webapp/project.md` | Development milestone table |
| `test/project.md` | Development milestone table |

Update immediately after completion — don't delay, don't batch.

---

## Module Status (from `开发计划.md` §六)

| Module | Backend | Miniapp | Webapp |
|:-------|:-------:|:-------:|:------:|
| M1 Auth | 🟢 | 🟢 | ⚪ |
| M2 Content | 🟢 | — | ⚪ |
| M3 AI Gen | 🟢 | — | ⚪ |
| M4 Notes & Review | 🟢 | 🟢 | ⚪ |
| M5 Learning | 🟢 | 🟢 | — |
| M6 Points | 🟢 | 🟢 | ⚪ |
| M7 Operations | 🟢 | — | ⚪ |
| M8 Analytics | 🟢 | — | ⚪ |
| M9 System | 🟢 | — | ⚪ |

Backend: all 3 services complete + deployed (M10 ✅). Miniapp: all 37 pages + 17 components done. Webapp: scaffolded, pages not built.

**Execution order:** M1 → M2 → M3 → M4, then parallel tracks.

---

## 1. Backend (`backend/`)

**Tech:** Python 3.12+ / FastAPI / PostgreSQL 16 (async SQLAlchemy + asyncpg) / Redis 7 (arq, rate limiting, cache) / DeepSeek API (via openai SDK)

### Services

| Service | Port | Exposure | Docker name | Schema | Key files |
|---------|:----:|----------|-------------|--------|-----------|
| Auth | 8001 | Public (login only) | `codesail-auth` | `auth` | `main.py`, `models/`, `routes/` |
| Knowledge | 8002 | Internal only | `codesail-knowledge` | `knowledge` | `main.py`, `models/`, `routes/`, `ai/`, `tasks/` |
| Core | 8000 | Public (all business) | `codesail-core` | `core` | `main.py`, `models/`, `routes/`, `services/`, `clients/`, `middleware/` |

PostgreSQL: `codesail-postgres` / Redis: `codesail-redis`

**Shared layer (`shared/`):** `auth.py` (JWT — Core validates locally, zero network latency), `config.py`, `errors.py` (unified error codes), `responses.py` (unified response format), `models/`, `seed.py`. Copied into each service's Docker build context.

**Service communication:** Core → Knowledge is the only internal call (httpx async, 30s timeout, 120s for AI). Auth is called directly by clients.

### VM Environment

| Item | Value |
|------|-------|
| SSH | `ssh -i "backend/.ssh/vm_key" peng@192.168.234.128` |
| Remote path | `/home/peng/memo/backend` |
| Environment check | Upload `scripts/check-env.sh` to VM, then `bash /tmp/check-env.sh` |
| Code sync | `.\backend\scripts\sync-backend.ps1` (full), `.\backend\scripts\watch-backend.ps1` (watch mode) |
| Rebuild after sync | `ssh ... "cd /home/peng/memo/backend && docker compose up -d --build <service>"` |

**Known state:** PostgreSQL ✅, Redis ✅, Auth ✅, Knowledge and Core depend on what's currently deployed. WX_MOCK_MODE=true (bypasses real WeChat API in dev).

### Development Cycle (Backend)

```
Step 1: Read doc anchors (ERD → API contract → responses.py → errors.py → auth/ for style)
Step 2: Confirm module boundary (which sub-project, what not to touch)
Step 3: Code (follow existing patterns in services/auth/)
Step 4: Write backend unit tests (Mock DB) + test integration tests (real API)
Step 5: Verify all tests pass + route coverage ≥ 90%
Step 6: Sync to VM → docker compose up -d --build → curl verify
Step 7: Frontend work (if module has corresponding pages)
Step 8: Git commit (Conventional Commits)
Step 9: Update milestone status in all 6 tracking files
```

**Doc anchors by task type:**
- ORM models → `backend/docs/database/01-数据库ERD设计文档.md`
- API routes → `backend/docs/api/各服务接口契约文档.md`
- Response format → `backend/shared/responses.py` (read the file)
- Error codes → `backend/shared/errors.py` (read the file)
- Code style reference → `backend/services/auth/`

### Testing Standards

**Two layers, both required:**

| Layer | Location | Method | Purpose |
|-------|----------|--------|---------|
| Unit tests | `backend/tests/` | FastAPI TestClient + AsyncMock | Route logic verification, coverage data |
| Integration tests | `test/tests/` | httpx against real containers | End-to-end validation |

**Route coverage target: ≥ 90%** (enforced, measured via `coverage run -m pytest`)

**Mock DB pattern (key rules):**
- `session.execute` → `AsyncMock` (not MagicMock)
- `session.delete` → `AsyncMock` (must be awaitable)
- `session.__aenter__` / `__aexit__` → `AsyncMock`
- Side effect lists must match the exact number of `await session.execute()` calls in the handler
- Test files must be pure ASCII (no Chinese chars — causes SyntaxError in container)
- Register AppException + RequestValidationError handlers on the test app
- Full patterns documented in the testing standards section above

**Curl verification template:**
```bash
# On VM, after rebuild:
curl -s http://localhost:<port>/api/v1/<endpoint> | python3 -m json.tool
# Verify: code=0, response structure matches shared/responses.py
```

### Commands

```bash
cd backend

# Infrastructure
docker compose up -d                    # Start all services
docker compose ps                       # Service health
docker compose logs -f <service>        # Tail logs
docker compose up -d --build <service>  # Rebuild single service

# Dependencies
pip install -r requirements.txt

# Tests
pytest                                              # All tests
pytest tests/services/auth/ -v                      # Auth only
pytest tests/services/knowledge/ -v                 # Knowledge only
pytest tests/services/core/ -v                      # Core only
pytest tests/services/auth/test_routes.py -k <name> # Single test
coverage run -m pytest tests/services/<svc>/ -v     # With coverage
coverage report --include="services/<svc>/routes/*" -m

# Alembic
cd services/<service> && alembic revision --autogenerate -m "description"
cd services/<service> && alembic upgrade head

# VM operations (PowerShell)
.\scripts\sync-backend.ps1                          # Sync code to VM
ssh -i ".ssh/vm_key" peng@192.168.234.128 "cd /home/peng/memo/backend && docker compose up -d --build <service>"
```

---

## 2. WeChat MiniApp (`miniapp/`)

**Tech:** Native WeChat framework + Skyline + glass-easel | **Status:** 37 pages + 17 components all 🟢

**API env:** `config/env.js` — currently PROD (`https://api.codesail.cn`). Switch to DEV for local VM testing.

**Dev:** Open in WeChat DevTools. No npm/CLI build — native toolchain.

### Miniapp-Backend Debug Checklist

When pages show no data, clicks don't work, or navigation fails — run these 5 checks in order (①②③ cover 80% of issues):

**① Page path registration** — navigation URL must match `app.json` exactly. Watch for duplicated directory names: `pages/learn/review-today/review-today` → should be `pages/learn/review-today`.

**② API response unwrapping** — `request.js` resolves `{code, data, meta}` to callbacks. Frontend must access `res.data`, not `res` directly. The `paginated()` helper returns data as array, total in `meta.total`.

**③ Field name alignment** — common mismatches:
| Backend returns | Frontend expects | Impact |
|:---------------|:-----------------|:-------|
| `question_text` | `question` / `content` | Questions don't render |
| `options` (object `{A:"text"}`) | `options` (array `[{letter,text}]`) | Options don't render |
| `question_id` | `id` | Submit fails |
| `points_earned` | `points` | Points not shown |

**④ WXML event passing** — `e.currentTarget.dataset` fails across component boundaries. Use `mark:` prefix: `<quiz-option mark:question-idx="{{index}}" />` → read with `e.mark['question-idx']`. Always use `wx:for-index="qIdx"` to avoid inner `wx:for` overwriting outer `index`.

**⑤ CSS layout constraints** — `flex: 1` scroll-view needs fixed height constraint: `.page-wrapper { height: 100vh; overflow: hidden; }` + child `.scroll-view { flex: 1; min-height: 0; }`. Add spacer to prevent fixed bottom buttons from covering content.

The 5-point checklist above covers the most common issues.

---

## 3. Web Admin (`webapp/`)

**Tech:** React 19 + TypeScript + Vite + Ant Design 6.x + Tailwind CSS 4  
**State:** Zustand + TanStack React Query | **Routing:** React Router 7 | **Rich text:** TipTap 3  
**Charts:** ECharts 6 | **Validation:** Zod 4 + React Hook Form | **Alias:** `@/` → `src/`

**Status:** Full scaffold with 18 pages, 9 components, 19 API modules (all Mock data). Pending real API integration.

**Key directories:** `src/pages/` (login, dashboard, ai, content, operation, analytics, users, system), `src/components/common/`, `src/stores/` (authStore, themeStore), `src/api/`, `src/types/`

**Before coding:** Load `webapp/project.md`, `docs/技术可行性分析报告.md`, and `docs/前端技术开发指导及规范.md`.

```bash
cd webapp
npm run dev        # :3000, proxy /api → localhost:8080
npm run build      # tsc --noEmit + vite build
npm run lint       # ESLint on src/
npm run typecheck  # tsc --noEmit
npm run test       # Vitest
npm run test:watch # Vitest watch
```

---

## 4. Test (`test/`)

**Scope:** Backend API (pytest), miniapp (manual cases), webapp (Playwright). Bug tracking via BugPack MCP. Status: M1 completed — 51 active integration tests (Auth 36 + Knowledge 51 + Core 1). See `test/project.md`.

---

## Design Tokens

| Token | Value |
|-------|-------|
| Web brand | `#160C57` (deep purple) |
| Miniapp brand | `#4A90D9` (tech blue, overridable by admin theme) |
| Border radius | 30px |
| Stroke | 8px |
| Design source | `miniapp/designs/CodeSail.pen` |

---

## Key Documents

| Domain | Path |
|--------|------|
| Dev plan & status | `开发计划.md` |
| Backend spec | `backend/project.md`, `backend/CLAUDE.md` |
| Backend tasks | `backend/tasks.md` |
| Miniapp spec | `miniapp/project.md`, `miniapp/CLAUDE.md`, `miniapp/tasks.md` |
| Webapp spec | `webapp/project.md`, `webapp/CLAUDE.md` |
| Test spec | `test/project.md`, `test/CLAUDE.md` |
| Model selection | `model-selection-strategy.md` |
| Backend ERD | `backend/docs/database/01-数据库ERD设计文档.md` |
| API contract | `backend/docs/api/各服务接口契约文档.md` |
| Backend architecture | `backend/docs/architecture/02-后端技术选型及架构设计文档.md` |
| Miniapp PRD | `miniapp/docs/PRD.md` |
| Miniapp interaction | `miniapp/docs/交互设计.md` |
| Webapp PRD | `webapp/docs/PRD.md` |
| Webapp tech guide | `webapp/docs/前端技术开发指导及规范.md` |
