from datetime import datetime, timedelta, timezone

import jwt
import pytest

from shared.auth import (
    create_access_token,
    create_refresh_token,
    extract_token,
    verify_jwt,
)

TEST_SECRET = "test-secret-key-for-unit-tests"


class TestCreateAccessToken:
    def test_payload_contains_required_claims(self):
        token = create_access_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
        )
        claims = jwt.decode(token, TEST_SECRET, algorithms=["HS256"])
        assert claims["sub"] == "admin"
        assert claims["role"] == "admin"
        assert claims["type"] == "access"
        assert isinstance(claims["iat"], int)
        assert isinstance(claims["exp"], int)
        assert isinstance(claims["jti"], str)

    def test_default_expiry_is_24_hours(self):
        token = create_access_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
        )
        claims = jwt.decode(token, TEST_SECRET, algorithms=["HS256"])
        assert claims["exp"] - claims["iat"] == 86400

    def test_custom_expiry(self):
        token = create_access_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
            expire_seconds=3600,
        )
        claims = jwt.decode(token, TEST_SECRET, algorithms=["HS256"])
        assert claims["exp"] - claims["iat"] == 3600

    def test_custom_algorithm(self):
        token = create_access_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
            algorithm="HS384",
        )
        claims = jwt.decode(token, TEST_SECRET, algorithms=["HS384"])
        assert claims["type"] == "access"

    def test_subject_and_role_preserved(self):
        token = create_access_token(
            subject="user_123",
            role="user",
            secret=TEST_SECRET,
        )
        claims = jwt.decode(token, TEST_SECRET, algorithms=["HS256"])
        assert claims["sub"] == "user_123"
        assert claims["role"] == "user"

    def test_jti_is_unique_per_call(self):
        token1 = create_access_token(subject="admin", role="admin", secret=TEST_SECRET)
        token2 = create_access_token(subject="admin", role="admin", secret=TEST_SECRET)
        claims1 = jwt.decode(token1, TEST_SECRET, algorithms=["HS256"])
        claims2 = jwt.decode(token2, TEST_SECRET, algorithms=["HS256"])
        assert claims1["jti"] != claims2["jti"]


class TestCreateRefreshToken:
    def test_type_is_refresh(self):
        token = create_refresh_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
        )
        claims = jwt.decode(token, TEST_SECRET, algorithms=["HS256"])
        assert claims["type"] == "refresh"

    def test_default_expiry_is_7_days(self):
        token = create_refresh_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
        )
        claims = jwt.decode(token, TEST_SECRET, algorithms=["HS256"])
        assert claims["exp"] - claims["iat"] == 604800

    def test_custom_expiry(self):
        token = create_refresh_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
            expire_seconds=7200,
        )
        claims = jwt.decode(token, TEST_SECRET, algorithms=["HS256"])
        assert claims["exp"] - claims["iat"] == 7200


class TestVerifyJwt:
    def test_valid_token_returns_claims(self):
        token = create_access_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
        )
        claims = verify_jwt(token, TEST_SECRET)
        assert claims["sub"] == "admin"
        assert claims["role"] == "admin"
        assert claims["type"] == "access"

    def test_wrong_secret_raises_error(self):
        token = create_access_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
        )
        with pytest.raises(jwt.InvalidTokenError):
            verify_jwt(token, "wrong-secret")

    def test_expired_token_raises_error(self):
        now = datetime.now(timezone.utc)
        payload = {
            "sub": "admin",
            "role": "admin",
            "type": "access",
            "iat": int((now - timedelta(seconds=7200)).timestamp()),
            "exp": int((now - timedelta(seconds=3600)).timestamp()),
            "jti": "test-jti",
        }
        token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
        with pytest.raises(jwt.ExpiredSignatureError):
            verify_jwt(token, TEST_SECRET)

    def test_missing_required_claim_raises_error(self):
        now = datetime.now(timezone.utc)
        payload = {
            "sub": "admin",
            "role": "admin",
            "type": "access",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=3600)).timestamp()),
        }
        token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
        with pytest.raises(jwt.MissingRequiredClaimError):
            verify_jwt(token, TEST_SECRET)

    def test_wrong_algorithm_raises_error(self):
        token = create_access_token(
            subject="admin",
            role="admin",
            secret=TEST_SECRET,
            algorithm="HS384",
        )
        with pytest.raises(jwt.InvalidTokenError):
            verify_jwt(token, TEST_SECRET, algorithm="HS256")


class TestExtractToken:
    def test_valid_bearer_header(self):
        assert extract_token("Bearer abc123") == "abc123"

    def test_no_bearer_prefix_raises_value_error(self):
        with pytest.raises(ValueError, match="Invalid authorization header format"):
            extract_token("abc123")

    def test_empty_string_raises_value_error(self):
        with pytest.raises(ValueError):
            extract_token("")

    def test_bearer_only_returns_empty(self):
        assert extract_token("Bearer ") == ""
