import pytest

from tests.conftest import anonymous_client, admin_client, assert_success_structure, assert_error_structure, admin_token


class TestAdminPasswordSuccess:

    def test_change_password_success(self, admin_client):
        resp = admin_client.put("/admin/password", json={
            "old_password": "admin123",
            "new_password": "admin_new_456",
        })

        assert resp.status_code == 200
        assert_success_structure(resp)
        assert resp.body["data"]["message"] == "Password updated successfully"

    def test_login_with_new_password_after_change(self, anonymous_client, admin_client):
        admin_client.put("/admin/password", json={
            "old_password": "admin_new_456",
            "new_password": "admin123",
        })

        resp = anonymous_client.post("/admin/login", json={
            "username": "admin",
            "password": "admin123",
        })

        assert resp.status_code == 200
        assert_success_structure(resp)
        assert resp.body["data"]["access_token"]


class TestAdminPasswordErrors:

    def test_wrong_old_password(self, admin_client):
        resp = admin_client.put("/admin/password", json={
            "old_password": "wrong_password_000",
            "new_password": "some_new_password_789",
        })

        assert resp.status_code == 401
        assert_error_structure(resp)
        assert resp.body["code"] == "INVALID_CREDENTIALS"

    def test_new_password_too_short(self, admin_client):
        resp = admin_client.put("/admin/password", json={
            "old_password": "admin123",
            "new_password": "ab3",
        })

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_new_password_exceeds_max_length(self, admin_client):
        resp = admin_client.put("/admin/password", json={
            "old_password": "admin123",
            "new_password": "a" * 129 + "1",
        })

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_new_password_letters_only(self, admin_client):
        resp = admin_client.put("/admin/password", json={
            "old_password": "admin123",
            "new_password": "abcdefghijk",
        })

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_new_password_digits_only(self, admin_client):
        resp = admin_client.put("/admin/password", json={
            "old_password": "admin123",
            "new_password": "1234567890",
        })

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_missing_old_password(self, admin_client):
        resp = admin_client.put("/admin/password", json={
            "new_password": "valid_new_password_123",
        })

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_missing_new_password(self, admin_client):
        resp = admin_client.put("/admin/password", json={
            "old_password": "admin123",
        })

        assert resp.status_code == 422
        assert_error_structure(resp)

    def test_no_authorization_header(self, anonymous_client):
        resp = anonymous_client.put("/admin/password", json={
            "old_password": "admin123",
            "new_password": "valid_new_password_123",
        })

        assert resp.status_code == 401
        assert_error_structure(resp)
        assert resp.body["code"] == "UNAUTHORIZED"


class TestAdminPasswordServiceUnavailable:

    @pytest.mark.skip(reason="Requires database-level admin deletion to trigger AUTH_FAILED")
    def test_user_not_found(self, admin_client):
        pass

    @pytest.mark.skip(reason="Requires a non-admin token to verify FORBIDDEN")
    def test_non_admin_token_forbidden(self, admin_client):
        pass
