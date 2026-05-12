from passlib.context import CryptContext

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.auth.models import Admin
from services.auth.routes.deps import get_db, get_current_admin
from shared.auth import create_access_token, create_refresh_token, verify_jwt
from shared.config import get_env
from shared.errors import AppException, ErrorCodes
from shared.responses import success

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int


@router.post("/login", response_model=None)
async def admin_login(
    body: AdminLoginRequest,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Admin).where(Admin.username == body.username)
    )
    admin = result.scalar_one_or_none()

    if admin is None:
        raise AppException(ErrorCodes.AUTH_FAILED, detail={"username": "User not found"})

    if not pwd_context.verify(body.password, admin.password_hash):
        raise AppException(ErrorCodes.INVALID_CREDENTIALS, detail={"password": "Invalid password"})

    secret = get_env("JWT_SECRET")
    algorithm = get_env("JWT_ALGORITHM", "HS256")
    access_expire = int(get_env("JWT_ACCESS_EXPIRE", "86400"))
    refresh_expire = int(get_env("JWT_REFRESH_EXPIRE", "604800"))

    access_token = create_access_token(
        subject=admin.username,
        role="admin",
        secret=secret,
        algorithm=algorithm,
        expire_seconds=access_expire,
    )
    refresh_token = create_refresh_token(
        subject=admin.username,
        role="admin",
        secret=secret,
        algorithm=algorithm,
        expire_seconds=refresh_expire,
    )

    return success(
        AdminLoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="Bearer",
            expires_in=access_expire,
        )
    )


@router.post("/refresh", response_model=None)
async def admin_refresh(body: RefreshRequest):
    secret = get_env("JWT_SECRET")
    algorithm = get_env("JWT_ALGORITHM", "HS256")
    access_expire = int(get_env("JWT_ACCESS_EXPIRE", "86400"))

    try:
        claims = verify_jwt(body.refresh_token, secret, algorithm)
    except Exception:
        raise AppException(ErrorCodes.UNAUTHORIZED, detail={"token": "Invalid or expired refresh token"})

    if claims.get("type") != "refresh" or claims.get("role") != "admin":
        raise AppException(ErrorCodes.UNAUTHORIZED, detail={"token": "Invalid token type"})

    access_token = create_access_token(
        subject=claims["sub"],
        role="admin",
        secret=secret,
        algorithm=algorithm,
        expire_seconds=access_expire,
    )

    return success(
        RefreshResponse(
            access_token=access_token,
            token_type="Bearer",
            expires_in=access_expire,
        )
    )


class PasswordChangeRequest(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class PasswordChangeResponse(BaseModel):
    message: str = "Password updated successfully"


@router.put("/password", response_model=None)
async def admin_change_password(
    body: PasswordChangeRequest,
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_admin),
):
    result = await session.execute(
        select(Admin).where(Admin.username == claims["sub"])
    )
    admin = result.scalar_one_or_none()

    if admin is None:
        raise AppException(ErrorCodes.AUTH_FAILED, detail={"username": "User not found"})

    if not pwd_context.verify(body.old_password, admin.password_hash):
        raise AppException(ErrorCodes.INVALID_CREDENTIALS, detail={"old_password": "Invalid password"})

    admin.password_hash = pwd_context.hash(body.new_password)
    await session.flush()

    return success(PasswordChangeResponse())
