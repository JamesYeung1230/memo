import pytest

from tests.conftest import anonymous_client, assert_success_structure, assert_error_structure, admin_token, admin_client
from tests.auth.conftest import require_mock_mode, wechat_new_code


@pytest.mark.admin
class TestAdminRefreshSuccess:

    def test_refresh_with_valid_token(self, anonymous_client, admin_client, admin_token):
        admin_login_resp = anonymous_client.post("/admin/login", json={
            "username": "admin",
            "password": "admin123",
        })
        refresh_token = admin_login_resp.body["data"]["refresh_token"]

        resp = anonymous_client.post("/admin/refresh", json={"refresh_token": refresh_token})

        assert resp.status_code == 200
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["access_token"]
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int) and data["expires_in"] > 0
        assert data["access_token"] != admin_login_resp.body["data"]["access_token"]


@pytest.mark.admin
class TestAdminRefreshErrors:

    def test_invalid_refresh_token(self, anonymous_client):
        resp = anonymous_client.post("/admin/refresh", json={"refresh_token": "invalid.token.here"})

        assert resp.status_code == 401
        assert_error_structure(resp)
        assert resp.body["code"] == "UNAUTHORIZED"

    def test_missing_refresh_token(self, anonymous_client):
        resp = anonymous_client.post("/admin/refresh", json={})

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_wechat_refresh_token_on_admin_endpoint(self, anonymous_client, wechat_new_code):
        require_mock_mode()
        login_resp = anonymous_client.post("/wechat/login", json={"code": wechat_new_code})
        wechat_refresh_token = login_resp.body["data"]["refresh_token"]

        resp = anonymous_client.post("/admin/refresh", json={"refresh_token": wechat_refresh_token})

        assert resp.status_code == 401
        assert_error_structure(resp)
        assert resp.body["code"] == "UNAUTHORIZED"
