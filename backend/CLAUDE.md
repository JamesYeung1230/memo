# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: CodeSail Backend (码上启航 后端)

Three FastAPI microservices powering the CodeSail learning platform. REST API with JWT auth, PostgreSQL 16, Redis 7, and DeepSeek AI.

## Commands

```bash
cd memo/backend

# Infrastructure
docker compose up -d                    # Start all 5 containers (PG, Redis, Auth, Knowledge, Core)
docker compose ps                       # Check service health
docker compose logs -f <service>        # Tail logs (auth|knowledge|core|postgres|redis)
docker compose up -d --build <service>  # Rebuild single service
docker compose restart <service>        # Restart without rebuild

# Dependencies
pip install -r requirements.txt

# Tests
pytest                                              # All unit tests (mock DB, no containers needed)
pytest tests/services/auth/ -v                      # Auth only
pytest tests/services/knowledge/ -v                 # Knowledge only
pytest tests/services/core/ -v                      # Core only
pytest tests/services/auth/test_routes.py -k <name> # Single test
coverage run -m pytest tests/services/<svc>/ -v     # With coverage
coverage report --include="services/<svc>/routes/*" -m

# Alembic (per service)
cd services/auth && alembic revision --autogenerate -m "description"
cd services/auth && alembic upgrade head
# Same pattern for knowledge/ and core/

# Lint
ruff check .
```

## Architecture

```
                    ┌──────────────┐
    Clients ───────→│ Auth (:8001) │  ★ Login endpoints only
                    └──────────────┘
                           │ JWT issued here
                           ▼
                    ┌──────────────┐
    Clients ───────→│ Core (:8000) │  ★ All business APIs (gateway)
                    │              │
                    │ JWT verified │──→ httpx ──→┌──────────────────┐
                    │   LOCALLY    │              │ Knowledge (:8002)│
                    │ (shared/     │              │ ★ Internal only  │
                    │  auth.py)    │              │ Content CRUD     │
                    └──────────────┘              │ AI Gen / Review  │
                                                  └──────────────────┘
                    ┌──────────────┐
                    │ PostgreSQL 16│  1 instance, 3 schemas
                    │ Redis 7      │  Cache + rate limit + arq queue
                    └──────────────┘
```

### Service Boundaries

| Service | Port | Public | Schema | Responsibility |
|---------|:----:|:------:|--------|----------------|
| **Auth** | 8001 | Login only | `auth` | Admin/WeChat login, JWT issue/refresh, password change |
| **Knowledge** | 8002 | ❌ Internal | `knowledge` | Domains/Chapters/Cards/Questions CRUD, AI generation (DeepSeek), sensitive words, note review pipeline |
| **Core** | 8000 | ✅ All APIs | `core` | Learning records, quiz answers, spaced repetition, notes, points, operations config, dashboards, admin APIs |

### Service Communication

- **Auth → Clients:** Direct (login endpoints are public)
- **Core → Knowledge:** httpx async, 30s timeout (120s for AI), retry on idempotent GET only
- **Core → Auth:** ❌ No network call — Core validates JWT locally via `shared/auth.py` (zero latency)
- **Service discovery:** Docker Compose internal DNS (service name = hostname)

## Shared Layer (`shared/`)

Copied into each service's Docker build context. Contains:

| File | Purpose |
|------|---------|
| `auth.py` | `create_access_token()`, `create_refresh_token()`, `verify_jwt()`, `extract_token()` — shared JWT secret between Auth (issue) and Core (verify) |
| `config.py` | `load_env()`, `get_database_url()`, `get_redis_url()`, `get_env()` |
| `errors.py` | `AppException` base + 10+ typed subclasses (`UnauthorizedError`, `NotFoundError`, `ValidationError`, `RateLimitedError`, `KnowledgeServiceException`, etc.) + `ErrorCodes` with 20+ error constants |
| `responses.py` | `success(data, meta)`, `paginated(items, total, page, page_size)`, `SuccessResponse[T]`, `ErrorResponse`, `PaginationMeta` |
| `models/knowledge_read.py` | Pydantic read models for cross-service data transfer (DomainRead, CardDetail, QuestionRead, ReviewResult, etc.) |
| `seed.py` | `DEFAULT_CONFIGS` dict + `init_default_configs()` for idempotent config seeding |

## API Conventions

### Response Format (absolute rule)
```json
// Success:
{"code": 0, "message": "success", "data": {...}, "request_id": "uuid"}
// Paginated:
{"code": 0, "message": "success", "data": [...], "meta": {"total": 100, "page": 1, "page_size": 20}, "request_id": "uuid"}
// Error:
{"code": 40101, "message": "Invalid credentials", "detail": {...}, "request_id": "uuid"}
```

### Error Handling
- **Always** raise `AppException` subclasses from `shared/errors.py` — never `HTTPException` directly
- Each service registers handlers for: `AppException`, `RequestValidationError`, `HTTPException`, `SQLAlchemyError`, generic `Exception`

### Route Conventions
- All routes are `async def`
- Prefix: `/api/v1/`
- SQLAlchemy async session injected via dependency (`get_db`)
- Services use `search_path` at engine level to isolate schemas

## Testing Standards

### Unit Tests (`backend/tests/`)
- **Pattern:** FastAPI `TestClient` + `unittest.mock.AsyncMock` for DB session
- **No real database** — mock `session.execute()`, `session.add()`, `session.commit()`, `session.delete()`
- **Key rules:**
  - `session.execute` → `AsyncMock` (NOT `MagicMock`)
  - `session.delete` → `AsyncMock` (must be awaitable)
  - `session.__aenter__` / `__aexit__` → `AsyncMock`
  - Side effect lists must match exact number of `await session.execute()` calls
  - Test files must be pure ASCII (no Chinese — causes SyntaxError in containers)
  - Register exception handlers on the test app
- **Route coverage target:** ≥ 90%

### Integration Tests (`memo/test/tests/`)
- httpx against real Docker containers
- Separate project at `memo/test/`

## Key Models

### Auth (`auth` schema)
- `Admin` — id, username (unique), password_hash (bcrypt)
- `User` — id, openid (unique), nickname, violation_count, review_ban_until, share_ban_until

### Knowledge (`knowledge` schema)
- `Domain` — id, name, icon, sort_order, is_free, unlock_points, status
- `Chapter` — id, domain_id (FK), name, sort_order, status
- `Card` — id, chapter_id (FK), title, core_concept, detail, life_analogy, tags (JSONB), difficulty, is_premium, soft delete
- `Question` — id, card_id (FK, unique), question_text, options (JSONB), correct_option, explanation
- `SensitiveWord` — id, word, match_mode (exact/pinyin/homophone/regex), enabled
- `ReviewRecord` — id, note_id, status (screening→ai_review→pending_manual→approved/rejected), risk_score, ai_risk_labels
- `AiGenerationHistory` — id, generation_type, topic, task_id, task_status, generated_content

### Core (`core` schema)
- `LearningRecord` — user_id, card_id, status, next_review_at
- `AnswerRecord` — user_id, question_id, selected_option, is_correct
- `Note` — user_id, title, content, tags (JSONB), audit_status, violation_flag
- `PointsRecord` — user_id, points, balance_after, action_type (9 types), description
- `Config` — config_key (unique), config_value (JSONB), version
- `Banner`, `Achievement`, `UserAchievement`, `OpLog`, `FavoriteCard`, `DailyChallengeRecord`, `ReviewConfig`

## AI Layer (`services/knowledge/ai/`)

| File | Purpose |
|------|---------|
| `base.py` | `AIProvider` Protocol: `generate_card()`, `generate_cards()`, `generate_question()`, `review_note()` |
| `deepseek_provider.py` | DeepSeek API via OpenAI SDK (`AsyncOpenAI`), JSON structured output, retry (max 2) |
| `mock_provider.py` | Returns hardcoded Chinese mock data for dev without API costs |
| `prompts.py` | System/user prompts in Chinese for card gen, question gen, 5-dimension note review |
| `__init__.py` | Factory: `get_provider()` → MockProvider if `AI_MOCK_MODE=true`, else DeepSeekProvider |

## Core Middleware

**`JWTAuthMiddleware`** — Every Core request passes through:
- **Public paths** (no auth): `/health`, `/docs`, `/openapi.json`, learn content browsing
- **Admin paths** (`/api/v1/admin/*`): Verify JWT, check `role == "admin"`, set `request.state.admin_id`
- **User paths** (`/api/v1/*`): Verify JWT, set `request.state.user_id`
- **JWT verification**: Local via `shared/auth.py` — no network call

## KnowledgeClient (`services/core/clients/`)

httpx async client calling Knowledge service. 54+ methods covering all Knowledge endpoints. Used by Core routes to delegate to Knowledge. 30s default timeout, 120s for AI generation.

## Docker

- 5 containers: postgres, redis, auth, knowledge, core
- Shared bridge network: `codesail-network`
- Named volumes: `codesail-postgres-data`, `codesail-redis-data`, `codesail-uploads-data`
- All services have health checks
- Auth has docker-entrypoint.sh for Alembic migrations on startup
- Knowledge sets `AI_MOCK_MODE=true` in dev

## Deployment

- **Production:** `https://api.codesail.cn` (Tencent Cloud 49.233.10.92)
- **Dev VM:** `peng@192.168.234.128` (SSH key: `backend/.ssh/vm_key`)
- **Sync:** `scripts/sync-backend.ps1` (full) or `scripts/watch-backend.ps1` (watch mode)
- **Rebuild on VM:** `ssh ... "cd /home/peng/memo/backend && docker compose up -d --build <service>"`

## Doc Anchors

| Task | Reference |
|------|-----------|
| DB schema | `docs/database/01-数据库ERD设计文档.md` |
| API contract | `docs/api/各服务接口契约文档.md` |
| Response format | `shared/responses.py` |
| Error codes | `shared/errors.py` |
| Env vars | `docs/operations/环境变量清单.md` |
| Seed data | `docs/database/02-种子数据定义文档.md` |
| Code style reference | `services/auth/` (the first service built, pattern to follow) |
| Quick reference | `docs/_templates/项目速查卡.md` |

## Boundaries

- Backend-only — never modify miniapp/webapp/test code
- Follow existing patterns in `services/auth/` for new code
- Use `shared/errors.py` exception classes, never raw `HTTPException`
- All routes must be `async def`
- No f-string SQL — parameterized queries only
- Never hardcode secrets — use env vars
