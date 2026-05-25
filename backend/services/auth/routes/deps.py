from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import verify_jwt
from shared.config import get_env
from shared.errors import AppException, ErrorCodes

security = HTTPBearer()


async def get_db(request: Request):
    async with request.app.state.db_session_factory() as session:
        yield session


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    try:
        secret = get_env("JWT_SECRET")
    except RuntimeError as e:
        raise AppException(ErrorCodes.INTERNAL_ERROR, detail={"config": str(e)})
    algorithm = get_env("JWT_ALGORITHM", "HS256")

    try:
        claims = verify_jwt(token, secret, algorithm)
    except Exception:
        raise AppException(ErrorCodes.UNAUTHORIZED, detail={"token": "Invalid or expired token"})

    if claims.get("role") != "admin":
        raise AppException(ErrorCodes.FORBIDDEN, detail={"role": "Admin role required"})

    return claims
