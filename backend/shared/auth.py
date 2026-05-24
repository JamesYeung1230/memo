import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import jwt

Role = Literal["admin", "user"]
TokenType = Literal["access", "refresh"]

JWTClaims = dict[str, Any]


def create_access_token(
    *,
    subject: str,
    role: Role,
    secret: str,
    algorithm: str = "HS256",
    expire_seconds: int = 86400,
) -> str:
    now = datetime.now(timezone.utc)
    payload: JWTClaims = {
        "sub": subject,
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expire_seconds)).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def create_refresh_token(
    *,
    subject: str,
    role: Role,
    secret: str,
    algorithm: str = "HS256",
    expire_seconds: int = 604800,
) -> str:
    now = datetime.now(timezone.utc)
    payload: JWTClaims = {
        "sub": subject,
        "role": role,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expire_seconds)).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def verify_jwt(
    token: str,
    secret: str,
    algorithm: str = "HS256",
) -> JWTClaims:
    return jwt.decode(
        token,
        secret,
        algorithms=[algorithm],
        options={"require": ["sub", "role", "type", "iat", "exp", "jti"]},
    )


def extract_token(auth_header: str) -> str:
    if not auth_header.startswith("Bearer "):
        raise ValueError("Invalid authorization header format")
    return auth_header.removeprefix("Bearer ")
