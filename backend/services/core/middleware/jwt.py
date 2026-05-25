from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse

from shared.auth import extract_token, verify_jwt
from shared.config import get_env
from shared.errors import ErrorCodes


class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        if request.url.path.startswith("/api/v1/admin/"):
            return await self._verify_admin(request, call_next)
        elif request.url.path.startswith("/api/v1/"):
            return await self._verify_user(request, call_next)

        return await call_next(request)

    async def _verify_admin(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={
                    "code": ErrorCodes.UNAUTHORIZED.code,
                    "message": "Authorization header is required",
                    "data": None,
                    "detail": {},
                },
            )

        try:
            token = extract_token(auth_header)
            secret = get_env("JWT_SECRET")
            algorithm = get_env("JWT_ALGORITHM", "HS256")
            claims = verify_jwt(token, secret, algorithm)
        except Exception:
            return JSONResponse(
                status_code=401,
                content={
                    "code": ErrorCodes.UNAUTHORIZED.code,
                    "message": "Invalid or expired token",
                    "data": None,
                    "detail": {},
                },
            )

        if claims.get("role") != "admin":
            return JSONResponse(
                status_code=403,
                content={
                    "code": ErrorCodes.FORBIDDEN.code,
                    "message": "Admin role required",
                    "data": None,
                    "detail": {},
                },
            )

        request.state.admin_id = claims.get("sub")
        request.state.token_claims = claims
        return await call_next(request)

    async def _verify_user(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={
                    "code": ErrorCodes.UNAUTHORIZED.code,
                    "message": "Authorization header is required",
                    "data": None,
                    "detail": {},
                },
            )

        try:
            token = extract_token(auth_header)
            secret = get_env("JWT_SECRET")
            algorithm = get_env("JWT_ALGORITHM", "HS256")
            claims = verify_jwt(token, secret, algorithm)
        except Exception:
            return JSONResponse(
                status_code=401,
                content={
                    "code": ErrorCodes.UNAUTHORIZED.code,
                    "message": "Invalid or expired token",
                    "data": None,
                    "detail": {},
                },
            )

        request.state.user_id = claims.get("sub")
        request.state.token_claims = claims
        return await call_next(request)
