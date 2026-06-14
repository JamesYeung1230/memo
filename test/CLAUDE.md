# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: CodeSail Test Engineering

Integration/E2E test suite for the CodeSail backend services. Validates real API behavior against running Docker containers.

## Tech Stack

- **Language:** Python 3.12+
- **Test framework:** pytest 8.x
- **HTTP client:** httpx (sync, against real containers)
- **Config:** python-dotenv (`.env` file)
- **Reports:** pytest-html

## Architecture

```
tests/
├── conftest.py              # Session fixtures: ApiClient, admin_token, asserts
├── utils/
│   └── client.py            # ApiClient wrapper (httpx.Client + ApiResponse dataclass)
├── auth/
│   ├── conftest.py          # Auth-specific fixtures (base_url → localhost:8001)
│   ├── test_health.py       # GET /health
│   ├── test_admin_login.py  # POST /admin/login
│   ├── test_admin_password.py  # PUT /admin/password
│   ├── test_admin_refresh.py   # POST /auth/refresh (admin)
│   ├── test_wechat_login.py    # POST /wechat/login
│   └── test_wechat_refresh.py  # POST /auth/refresh (wechat)
├── knowledge/
│   ├── conftest.py          # Knowledge fixtures (base_url → localhost:8002)
│   ├── test_domain.py       # Domain CRUD
│   ├── test_chapter.py      # Chapter CRUD
│   ├── test_card.py         # Card CRUD
│   ├── test_question.py     # Question CRUD
│   ├── test_ai_generation.py   # AI generation endpoints
│   ├── test_sensitive_words.py # Sensitive word CRUD + matching
│   └── test_review.py       # AI review pipeline
└── core/
    ├── conftest.py          # Core fixtures (base_url → localhost:8000)
    └── test_health.py       # GET /health
```

## Commands

```bash
cd memo/test

# Install deps
pip install -r requirements.txt

# Run all tests
pytest

# Run specific service
pytest tests/auth/ -v
pytest tests/knowledge/ -v
pytest tests/core/ -v

# Run with markers
pytest -m smoke
pytest -m auth
pytest -m knowledge

# Run single test
pytest tests/auth/test_admin_login.py -k test_login_success -v

# With HTML report
pytest --html=report.html
```

## Configuration

Copy `.env.example` to `.env` and set:

```
AUTH_BASE_URL=http://localhost:8001/api/v1
KNOWLEDGE_BASE_URL=http://localhost:8002/api/v1
CORE_BASE_URL=http://localhost:8000/api/v1
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
WX_MOCK_MODE=true
```

## Key Patterns

### ApiClient (`tests/utils/client.py`)
- Wraps `httpx.Client` with base URL + optional Bearer token
- Methods: `get(path, params)`, `post(path, json)`, `put(path, json)`, `delete(path)`
- Returns `ApiResponse(status_code, body, headers)` dataclass
- Session-scoped; call `.close()` in fixture teardown

### Shared fixtures (`tests/conftest.py`)
- `base_url` → from `AUTH_BASE_URL` env var
- `admin_credentials` → from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars
- `admin_token` → logs in once per session, extracts `data.access_token`
- `admin_client` → ApiClient pre-configured with admin Bearer token
- `assert_success_structure(resp)` → asserts `code=0, message="success", "data" in body`
- `assert_error_structure(resp)` → asserts `code` and `message` present

### Test organization
- Each service has its own `conftest.py` with service-specific `base_url` override
- Tests run against **real Docker containers** — ensure `docker compose up -d` is running
- Session-scoped fixtures mean one login per test run, not per test

## Prerequisites

- Backend Docker containers running (`cd ../backend && docker compose up -d`)
- `.env` file configured with correct URLs and credentials

## Bug Tracking

Bugs found during testing are reported via BugPack MCP service. See `../BugPack/` for the BugPack tool.

## Boundaries

- Tests validate API behavior, not implementation details
- Use httpx (sync) not requests — matches the ApiClient pattern
- Do not modify backend code to make tests pass — report bugs instead
- All test files must be pure ASCII (no Chinese characters — causes issues in containers)
