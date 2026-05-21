"""
Auth service route unit tests - Mock DB full coverage.
Strategy: Use FastAPI TestClient + Mock AsyncSession to verify all route paths.
Covers 2 route files (wechat + admin) + health endpoint (success + error paths).
"""

import os
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from services.auth.routes import admin_router, wechat_router
from shared.auth import create_refresh_token
from shared.errors import AppException

# Set test environment variables (must be set before importing deps that call get_env)
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-unit-tests")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_EXPIRE", "86400")
os.environ.setdefault("JWT_REFRESH_EXPIRE", "604800")
os.environ.setdefault("WX_MOCK_MODE", "true")
os.environ.setdefault("WX_APPID", "test-appid")
os.environ.setdefault("WX_SECRET", "test-secret")


# ============================================================
# Helper: Build Mock Session
# TestClient runs async handler as:
#   session_factory() -> async with -> __aenter__ -> session
#   await session.execute() -> result (MagicMock)
#   result.scalar_one_or_none() -> synchronous return value
# ============================================================

def _mock_result(**kwargs):
    """Create synchronous return object for execute()"""
    r = MagicMock()
    for k, v in kwargs.items():
        if k == "scalars_all":
            s = MagicMock()
            s.all = MagicMock(return_value=v)
            r.scalars = MagicMock(return_value=s)
        elif k == "scalar":
            r.scalar = MagicMock(return_value=v)
        elif k == "scalar_one_or_none":
            r.scalar_one_or_none = MagicMock(return_value=v)
        elif k == "one_or_none":
            r.one_or_none = MagicMock(return_value=v)
    return r


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def mock_session():
    """AsyncMock session: execute return value is MagicMock (sync method)"""
    session = AsyncMock()
    session.add = MagicMock()
    session.delete = AsyncMock()
    session.commit = AsyncMock(return_value=None)
    session.refresh = AsyncMock(return_value=None)
    session.execute = AsyncMock(return_value=_mock_result())
    return session


@pytest.fixture
def mock_bcrypt_check():
    """Mock bcrypt.checkpw to control password verification in tests"""
    with patch("services.auth.routes.admin.bcrypt.checkpw") as mock:
        yield mock


@pytest.fixture
def client(mock_session):
    """Use TestClient for sync calls (wraps async handler)"""
    app = FastAPI()
    app.include_router(admin_router)
    app.include_router(wechat_router)

    # Add health endpoint (same as main.py)
    @app.get("/health")
    async def health():
        return {"status": "ok"}

    # Mock db_session_factory
    # async with factory() as session -> mock_session.__aenter__ -> mock_session
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    app.state.db_session_factory = MagicMock(return_value=mock_session)

    # Override get_current_admin to return mock claims
    from services.auth.routes.deps import get_current_admin
    app.dependency_overrides[get_current_admin] = lambda: {
        "sub": "admin",
        "role": "admin",
        "type": "access",
    }

    # Register exception handlers (mirroring main.py)
    @app.exception_handler(AppException)
    async def app_exc_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.http_status,
            content={**exc.to_dict(), "request_id": ""},
        )

    @app.exception_handler(RequestValidationError)
    async def val_exc_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "data": None,
                "detail": {
                    "errors": [
                        {"loc": e["loc"], "msg": e["msg"], "type": e["type"]}
                        for e in exc.errors()
                    ]
                },
                "request_id": "",
            },
        )

    return TestClient(app)


@pytest.fixture
def mock_user():
    """Mock User model for existing user tests"""
    u = MagicMock()
    u.id = uuid.uuid4()
    u.openid = "mock_openid_existing_user"
    u.nickname = "test-user"
    u.avatar_url = "https://example.com/avatar.png"
    u.violation_count = 0
    u.review_ban_until = None
    u.share_ban_until = None
    u.last_login_at = None
    return u


@pytest.fixture
def mock_admin():
    """Mock Admin model - bcrypt checkpw is mocked separately"""
    a = MagicMock()
    a.id = uuid.uuid4()
    a.username = "admin"
    a.password_hash = "$2b$12$dummyhashforunittesting1234567890abcdefghijk"  # mocked away
    return a


@pytest.fixture
def valid_refresh_token() -> str:
    """Create a valid refresh token for testing"""
    return create_refresh_token(
        subject="test_user",
        role="user",
        secret=os.environ["JWT_SECRET"],
        algorithm=os.environ["JWT_ALGORITHM"],
    )


@pytest.fixture
def valid_admin_refresh_token() -> str:
    """Create a valid admin refresh token for testing"""
    return create_refresh_token(
        subject="admin",
        role="admin",
        secret=os.environ["JWT_SECRET"],
        algorithm=os.environ["JWT_ALGORITHM"],
    )


# ============================================================
# Test: Health Endpoint
# ============================================================

class TestHealthEndpoint:
    def test_health_success(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


# ============================================================
# Test: WeChat Login Routes
# ============================================================

class TestWechatLoginRoutes:
    """Tests for POST /api/v1/wechat/login"""

    def test_wechat_login_new_user(self, client, mock_session):
        """New user: user not found in DB, creates new user, returns is_new_user=True"""
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/wechat/login", json={"code": "new_user_abc"})
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["is_new_user"] is True
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int) and data["expires_in"] > 0

    def test_wechat_login_existing_user(self, client, mock_session, mock_user):
        """Existing user: user found in DB, returns is_new_user=False"""
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_user)
        resp = client.post("/api/v1/wechat/login", json={"code": "existing_user"})
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["is_new_user"] is False
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["token_type"] == "Bearer"

    def test_wechat_login_empty_code(self, client):
        """Empty code should return 422 validation error"""
        resp = client.post("/api/v1/wechat/login", json={"code": ""})
        assert resp.status_code == 422
        body = resp.json()
        assert body["code"] == "VALIDATION_ERROR"

    def test_wechat_login_missing_code(self, client):
        """Missing code field should return 422 validation error"""
        resp = client.post("/api/v1/wechat/login", json={})
        assert resp.status_code == 422
        body = resp.json()
        assert body["code"] == "VALIDATION_ERROR"

    def test_wechat_login_response_structure(self, client, mock_session):
        """Verify response structure for successful login"""
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/wechat/login", json={"code": "test_code"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["code"] == 0
        assert body["message"] == "success"
        data = body["data"]
        required_fields = ["access_token", "refresh_token", "token_type", "expires_in", "is_new_user"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"


# ============================================================
# Test: WeChat Refresh Routes
# ============================================================

class TestWechatRefreshRoutes:
    """Tests for POST /api/v1/wechat/refresh"""

    def test_wechat_refresh_valid(self, client, valid_refresh_token):
        """Valid refresh token should return a new access token"""
        resp = client.post("/api/v1/wechat/refresh", json={"refresh_token": valid_refresh_token})
        assert resp.status_code == 200
        body = resp.json()
        assert body["code"] == 0
        data = body["data"]
        assert data["access_token"]
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int) and data["expires_in"] > 0

    def test_wechat_refresh_invalid_token(self, client):
        """Invalid refresh token should return 401"""
        resp = client.post("/api/v1/wechat/refresh", json={"refresh_token": "invalid_token_xyz"})
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "UNAUTHORIZED"

    def test_wechat_refresh_missing_token(self, client):
        """Missing refresh_token field should return 422"""
        resp = client.post("/api/v1/wechat/refresh", json={})
        assert resp.status_code == 422
        body = resp.json()
        assert body["code"] == "VALIDATION_ERROR"

    def test_wechat_refresh_access_token_rejected(self, client):
        """An access token should NOT work as a refresh token (wrong type claim)"""
        from shared.auth import create_access_token
        access_only = create_access_token(
            subject="test_user",
            role="user",
            secret=os.environ["JWT_SECRET"],
        )
        resp = client.post("/api/v1/wechat/refresh", json={"refresh_token": access_only})
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "UNAUTHORIZED"

    def test_wechat_refresh_admin_token_rejected(self, client, valid_admin_refresh_token):
        """An admin refresh token should NOT work for wechat (wrong role claim)"""
        resp = client.post("/api/v1/wechat/refresh", json={"refresh_token": valid_admin_refresh_token})
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "UNAUTHORIZED"


# ============================================================
# Test: Admin Login Routes
# ============================================================

class TestAdminLoginRoutes:
    """Tests for POST /api/v1/admin/login"""

    def test_admin_login_success(self, client, mock_session, mock_admin, mock_bcrypt_check):
        """Valid admin credentials should return 200 with tokens"""
        mock_bcrypt_check.return_value = True
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_admin)
        resp = client.post("/api/v1/admin/login", json={"username": "admin", "password": "Admin@123"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["code"] == 0
        data = body["data"]
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int) and data["expires_in"] > 0

    def test_admin_login_wrong_password(self, client, mock_session, mock_admin, mock_bcrypt_check):
        """Wrong password should return 401 INVALID_CREDENTIALS"""
        mock_bcrypt_check.return_value = False
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_admin)
        resp = client.post("/api/v1/admin/login", json={"username": "admin", "password": "WrongPass1"})
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "INVALID_CREDENTIALS"

    def test_admin_login_nonexistent_user(self, client, mock_session):
        """Non-existent username should return 401 AUTH_FAILED"""
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/admin/login", json={"username": "unknown_user", "password": "SomePass1"})
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "AUTH_FAILED"

    def test_admin_login_password_no_letter(self, client):
        """Password without letters should return 422"""
        resp = client.post("/api/v1/admin/login", json={
            "username": "admin",
            "password": "12345678",
        })
        assert resp.status_code == 422

    def test_admin_login_password_no_digit(self, client):
        """Password without digits should return 422"""
        resp = client.post("/api/v1/admin/login", json={
            "username": "admin",
            "password": "abcdefgh",
        })
        assert resp.status_code == 422

    def test_admin_login_password_too_short(self, client):
        """Password < 8 chars should return 422"""
        resp = client.post("/api/v1/admin/login", json={
            "username": "admin",
            "password": "Ab1",
        })
        assert resp.status_code == 422

    def test_admin_login_username_empty(self, client):
        """Empty username should return 422"""
        resp = client.post("/api/v1/admin/login", json={
            "username": "",
            "password": "Admin@123",
        })
        assert resp.status_code == 422

    def test_admin_login_missing_fields(self, client):
        """Missing body fields should return 422"""
        resp = client.post("/api/v1/admin/login", json={})
        assert resp.status_code == 422

    def test_admin_login_response_structure(self, client, mock_session, mock_admin, mock_bcrypt_check):
        """Verify full response structure for successful login"""
        mock_bcrypt_check.return_value = True
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_admin)
        resp = client.post("/api/v1/admin/login", json={"username": "admin", "password": "Admin@123"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["code"] == 0
        assert body["message"] == "success"
        assert "data" in body
        data = body["data"]
        for field in ["access_token", "refresh_token", "token_type", "expires_in"]:
            assert field in data, f"Missing field: {field}"


# ============================================================
# Test: Admin Refresh Routes
# ============================================================

class TestAdminRefreshRoutes:
    """Tests for POST /api/v1/admin/refresh"""

    def test_admin_refresh_valid(self, client, valid_admin_refresh_token):
        """Valid admin refresh token should return a new access token"""
        resp = client.post("/api/v1/admin/refresh", json={"refresh_token": valid_admin_refresh_token})
        assert resp.status_code == 200
        body = resp.json()
        assert body["code"] == 0
        data = body["data"]
        assert data["access_token"]
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int) and data["expires_in"] > 0

    def test_admin_refresh_invalid_token(self, client):
        """Invalid refresh token should return 401"""
        resp = client.post("/api/v1/admin/refresh", json={"refresh_token": "invalid_token_xyz"})
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "UNAUTHORIZED"

    def test_admin_refresh_missing_token(self, client):
        """Missing refresh_token field should return 422"""
        resp = client.post("/api/v1/admin/refresh", json={})
        assert resp.status_code == 422
        body = resp.json()
        assert body["code"] == "VALIDATION_ERROR"

    def test_admin_refresh_user_token_rejected(self, client, valid_refresh_token):
        """A user refresh token should NOT work for admin (wrong role claim)"""
        resp = client.post("/api/v1/admin/refresh", json={"refresh_token": valid_refresh_token})
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "UNAUTHORIZED"

    def test_admin_refresh_access_token_rejected(self, client):
        """An access token should NOT work as a refresh token (wrong type claim)"""
        from shared.auth import create_access_token
        access_only = create_access_token(
            subject="admin",
            role="admin",
            secret=os.environ["JWT_SECRET"],
        )
        resp = client.post("/api/v1/admin/refresh", json={"refresh_token": access_only})
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "UNAUTHORIZED"


# ============================================================
# Test: Admin Change Password Routes
# ============================================================

class TestAdminPasswordRoutes:
    """Tests for PUT /api/v1/admin/password"""

    def test_change_password_success(self, client, mock_session, mock_admin, mock_bcrypt_check):
        """Valid old password + valid new password should return 200"""
        mock_bcrypt_check.return_value = True
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_admin)
        resp = client.put(
            "/api/v1/admin/password",
            json={"old_password": "OldPass1", "new_password": "NewPass123"},
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["code"] == 0
        assert body["data"]["message"] == "Password updated successfully"

    def test_change_password_wrong_old(self, client, mock_session, mock_admin, mock_bcrypt_check):
        """Wrong old password should return 401"""
        mock_bcrypt_check.return_value = False
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_admin)
        resp = client.put(
            "/api/v1/admin/password",
            json={"old_password": "WrongOld1", "new_password": "NewPass123"},
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "INVALID_CREDENTIALS"

    def test_change_password_admin_not_found(self, client, mock_session):
        """Admin not found in DB should return 401"""
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put(
            "/api/v1/admin/password",
            json={"old_password": "OldPass1", "new_password": "NewPass123"},
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert resp.status_code == 401
        body = resp.json()
        assert body["code"] == "AUTH_FAILED"

    def test_change_password_new_too_short(self, client, mock_session, mock_admin, mock_bcrypt_check):
        """New password < 8 chars should return 422"""
        mock_bcrypt_check.return_value = True
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_admin)
        resp = client.put(
            "/api/v1/admin/password",
            json={"old_password": "OldPass1", "new_password": "Ab1"},
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert resp.status_code == 422

    def test_change_password_new_no_letter(self, client, mock_session, mock_admin, mock_bcrypt_check):
        """New password without letters should return 422"""
        mock_bcrypt_check.return_value = True
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_admin)
        resp = client.put(
            "/api/v1/admin/password",
            json={"old_password": "OldPass1", "new_password": "12345678"},
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert resp.status_code == 422

    def test_change_password_new_no_digit(self, client, mock_session, mock_admin, mock_bcrypt_check):
        """New password without digits should return 422"""
        mock_bcrypt_check.return_value = True
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_admin)
        resp = client.put(
            "/api/v1/admin/password",
            json={"old_password": "OldPass1", "new_password": "abcdefgh"},
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert resp.status_code == 422

    def test_change_password_missing_fields(self, client):
        """Missing required fields should return 422"""
        resp = client.put(
            "/api/v1/admin/password",
            json={},
            headers={"Authorization": "Bearer dummy_token"},
        )
        assert resp.status_code == 422
