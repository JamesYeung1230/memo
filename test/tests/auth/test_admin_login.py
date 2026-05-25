import pytest

from tests.conftest import anonymous_client, assert_success_structure, assert_error_structure, admin_credentials


@pytest.mark.admin
class TestAdminLoginSuccess:

    def test_login_success(self, anonymous_client, admin_credentials):
        resp = anonymous_client.post("/admin/login", json=admin_credentials)

        assert resp.status_code == 200
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int) and data["expires_in"] > 0

    def test_response_structure(self, anonymous_client, admin_credentials):
        resp = anonymous_client.post("/admin/login", json=admin_credentials)

        assert_success_structure(resp)
        data = resp.body["data"]
        for field in ["access_token", "refresh_token", "token_type", "expires_in"]:
            assert field in data, f"Missing field: {field}"


@pytest.mark.admin
class TestAdminLoginErrors:

    def test_wrong_password(self, anonymous_client, admin_credentials):
        wrong = {**admin_credentials, "password": "wrong_password_123"}
        resp = anonymous_client.post("/admin/login", json=wrong)

        assert resp.status_code == 401
        assert_error_structure(resp)
        assert resp.body["code"] == "INVALID_CREDENTIALS"

    def test_nonexistent_username(self, anonymous_client):
        resp = anonymous_client.post("/admin/login", json={
            "username": "nonexistent_user_xyz",
            "password": "some_password_123",
        })

        assert resp.status_code == 401
        assert_error_structure(resp)
        assert resp.body["code"] == "AUTH_FAILED"

    def test_username_exceeds_max_length(self, anonymous_client):
        resp = anonymous_client.post("/admin/login", json={
            "username": "a" * 51,
            "password": "valid_password_123",
        })

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_password_exceeds_max_length(self, anonymous_client, admin_credentials):
        resp = anonymous_client.post("/admin/login", json={
            "username": admin_credentials["username"],
            "password": "a" * 129 + "1",
        })

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_missing_required_fields(self, anonymous_client):
        resp = anonymous_client.post("/admin/login", json={})

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_error_response_structure(self, anonymous_client):
        resp = anonymous_client.post("/admin/login", json={
            "username": "nonexistent_user_xyz",
            "password": "some_password_123",
        })

        assert_error_structure(resp)
        assert isinstance(resp.body["code"], str)
        assert isinstance(resp.body["message"], str)
