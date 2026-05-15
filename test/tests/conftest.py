import os

import pytest

from tests.utils.client import ApiClient

WX_MOCK_ENABLED = os.getenv("WX_MOCK_MODE", "false").lower() == "true"


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.getenv("AUTH_BASE_URL", "http://localhost:8001/api/v1")


@pytest.fixture(scope="session")
def admin_credentials() -> dict:
    return {
        "username": os.getenv("ADMIN_USERNAME", "admin"),
        "password": os.getenv("ADMIN_PASSWORD", "admin123"),
    }


@pytest.fixture(scope="session")
def anonymous_client(base_url: str) -> ApiClient:
    client = ApiClient(base_url)
    yield client
    client.close()


@pytest.fixture(scope="session")
def admin_token(anonymous_client: ApiClient, admin_credentials: dict) -> str:
    resp = anonymous_client.post("/admin/login", json=admin_credentials)
    assert resp.status_code == 200, (
        f"Admin login failed: {resp.status_code} {resp.body}"
    )
    return resp.body["data"]["access_token"]


@pytest.fixture(scope="session")
def admin_client(base_url: str, admin_token: str) -> ApiClient:
    client = ApiClient(base_url, token=admin_token)
    yield client
    client.close()


def assert_success_structure(resp):
    assert resp.body["code"] == 0
    assert resp.body["message"] == "success"
    assert "data" in resp.body


def assert_error_structure(resp):
    assert "code" in resp.body
    assert "message" in resp.body
