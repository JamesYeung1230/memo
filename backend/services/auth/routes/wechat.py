import uuid
from datetime import datetime, timezone

import httpx

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.auth.models import User
from services.auth.routes.deps import get_db
from shared.auth import create_access_token, create_refresh_token
from shared.config import get_env
from shared.errors import AppException, ErrorCodes
from shared.responses import success

router = APIRouter(prefix="/api/v1/wechat", tags=["WeChat Auth"])


class WeChatLoginRequest(BaseModel):
    code: str = Field(min_length=1)


class WeChatLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    is_new_user: bool = False


async def _get_openid_from_wechat(code: str) -> str:
    appid = get_env("WX_APPID")
    secret = get_env("WX_SECRET")

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            "https://api.weixin.qq.com/sns/jscode2session",
            params={
                "appid": appid,
                "secret": secret,
                "js_code": code,
                "grant_type": "authorization_code",
            },
        )
        data = resp.json()

    if "errcode" in data and data["errcode"] != 0:
        raise AppException(
            ErrorCodes.INTEGRATION_ERROR,
            message=f"WeChat API error: {data.get('errmsg', 'unknown')}",
        )

    openid = data.get("openid")
    if not openid:
        raise AppException(
            ErrorCodes.INTEGRATION_ERROR,
            message="WeChat API did not return openid",
        )

    return openid


async def _mock_get_openid(code: str) -> str:
    return f"mock_openid_{code}"


@router.post("/login", response_model=None)
async def wechat_login(
    body: WeChatLoginRequest,
    session: AsyncSession = Depends(get_db),
):
    mock_mode = get_env("WX_MOCK_MODE", "false").lower() == "true"

    if mock_mode:
        openid = await _mock_get_openid(body.code)
    else:
        openid = await _get_openid_from_wechat(body.code)

    result = await session.execute(select(User).where(User.openid == openid))
    user = result.scalar_one_or_none()

    is_new_user = False

    if user is None:
        user = User(
            id=uuid.uuid4(),
            openid=openid,
            nickname=None,
            avatar_url=None,
        )
        session.add(user)
        is_new_user = True
    else:
        user.last_login_at = datetime.now(timezone.utc)

    await session.flush()

    secret = get_env("JWT_SECRET")
    algorithm = get_env("JWT_ALGORITHM", "HS256")
    access_expire = int(get_env("JWT_ACCESS_EXPIRE", "86400"))
    refresh_expire = int(get_env("JWT_REFRESH_EXPIRE", "604800"))

    access_token = create_access_token(
        subject=openid,
        role="user",
        secret=secret,
        algorithm=algorithm,
        expire_seconds=access_expire,
    )
    refresh_token = create_refresh_token(
        subject=openid,
        role="user",
        secret=secret,
        algorithm=algorithm,
        expire_seconds=refresh_expire,
    )

    return success(
        WeChatLoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="Bearer",
            expires_in=access_expire,
            is_new_user=is_new_user,
        )
    )
