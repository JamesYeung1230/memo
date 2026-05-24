import pytest

from tests.conftest import anonymous_client, assert_success_structure, assert_error_structure
from tests.auth.conftest import require_mock_mode, wechat_new_code, wechat_existing_code


@pytest.mark.wechat
class TestWechatLoginSuccess:

    def test_new_user_login_returns_is_new_user_true(self, anonymous_client, wechat_new_code):
        require_mock_mode()
        resp = anonymous_client.post("/wechat/login", json={"code": wechat_new_code})

        assert resp.status_code == 200
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int) and data["expires_in"] > 0
        assert data["is_new_user"] is True

    def test_existing_user_login_returns_is_new_user_false(self, anonymous_client, wechat_existing_code):
        require_mock_mode()
        resp = anonymous_client.post("/wechat/login", json={"code": wechat_existing_code})

        assert resp.status_code == 200
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["is_new_user"] is False

    def test_token_differs_on_each_login(self, anonymous_client, wechat_new_code):
        require_mock_mode()
        resp1 = anonymous_client.post("/wechat/login", json={"code": wechat_new_code})
        resp2 = anonymous_client.post("/wechat/login", json={"code": wechat_new_code})

        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.body["data"]["access_token"] != resp2.body["data"]["access_token"]

    def test_response_structure(self, anonymous_client, wechat_new_code):
        require_mock_mode()
        resp = anonymous_client.post("/wechat/login", json={"code": wechat_new_code})

        assert_success_structure(resp)
        data = resp.body["data"]
        required_fields = ["access_token", "refresh_token", "token_type", "expires_in", "is_new_user"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"


@pytest.mark.wechat
class TestWechatLoginValidation:

    def test_code_empty_string(self, anonymous_client):
        require_mock_mode()
        resp = anonymous_client.post("/wechat/login", json={"code": ""})

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_missing_code_field(self, anonymous_client):
        require_mock_mode()
        resp = anonymous_client.post("/wechat/login", json={})

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_error_response_structure(self, anonymous_client):
        require_mock_mode()
        resp = anonymous_client.post("/wechat/login", json={})

        assert_error_structure(resp)
        assert isinstance(resp.body["code"], str)
        assert isinstance(resp.body["message"], str)
