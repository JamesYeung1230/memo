from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from shared.config import get_database_url, load_env
from shared.errors import AppException
from shared.responses import ErrorDetail, ErrorResponse
from services.auth.routes import admin_router, wechat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_env()
    engine = create_async_engine(get_database_url("auth"), pool_size=5, max_overflow=10)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    app.state.db_engine = engine
    app.state.db_session_factory = session_factory
    yield
    await engine.dispose()


app = FastAPI(title="Auth Service", version="1.0.0", lifespan=lifespan)

app.include_router(admin_router)
app.include_router(wechat_router)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.http_status, content=exc.to_dict())


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Request validation failed",
                detail={"errors": exc.errors()},
            )
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error=ErrorDetail(
                code="INTERNAL_ERROR",
                message="Internal server error",
                detail={},
            )
        ).model_dump(),
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
