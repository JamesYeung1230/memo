import pytest

from tests.conftest import anonymous_client, assert_success_structure, assert_error_structure
from tests.auth.conftest import require_mock_mode, wechat_new_code, wechat_existing_code


@pytest.mark.wechat
class TestWechatRefreshSuccess:

    def test_refresh_with_valid_token(self, anonymous_client, wechat_new_code):
        require_mock_mode()
        login_resp = anonymous_client.post("/wechat/login", json={"code": wechat_new_code})
        assert login_resp.status_code == 200
        refresh_token = login_resp.body["data"]["refresh_token"]

        resp = anonymous_client.post("/wechat/refresh", json={"refresh_token": refresh_token})

        assert resp.status_code == 200
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["access_token"]
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int) and data["expires_in"] > 0
        assert data["access_token"] != login_resp.body["data"]["access_token"]

    def test_response_structure(self, anonymous_client, wechat_new_code):
        require_mock_mode()
        login_resp = anonymous_client.post("/wechat/login", json={"code": wechat_new_code})
        refresh_token = login_resp.body["data"]["refresh_token"]

        resp = anonymous_client.post("/wechat/refresh", json={"refresh_token": refresh_token})

        assert_success_structure(resp)
        data = resp.body["data"]
        for field in ["access_token", "token_type", "expires_in"]:
            assert field in data, f"Missing field: {field}"


@pytest.mark.wechat
class TestWechatRefreshErrors:

    def test_invalid_refresh_token(self, anonymous_client):
        require_mock_mode()
        resp = anonymous_client.post("/wechat/refresh", json={"refresh_token": "invalid.token.here"})

        assert resp.status_code == 401
        assert_error_structure(resp)
        assert resp.body["code"] == "UNAUTHORIZED"

    def test_access_token_instead_of_refresh(self, anonymous_client, wechat_new_code):
        require_mock_mode()
        login_resp = anonymous_client.post("/wechat/login", json={"code": wechat_new_code})
        access_token = login_resp.body["data"]["access_token"]

        resp = anonymous_client.post("/wechat/refresh", json={"refresh_token": access_token})

        assert resp.status_code == 401
        assert_error_structure(resp)
        assert resp.body["code"] == "UNAUTHORIZED"

    def test_missing_refresh_token(self, anonymous_client):
        require_mock_mode()
        resp = anonymous_client.post("/wechat/refresh", json={})

        assert resp.status_code == 422
        assert_error_structure(resp)
