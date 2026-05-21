import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from shared.config import get_database_url, load_env
from shared.errors import AppException
from services.core.clients import KnowledgeClient
from services.core.middleware.jwt import JWTAuthMiddleware
from services.core.routes.learning import router as learning_router
from services.core.routes.quiz import router as quiz_router

logger = logging.getLogger("core")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_env()
    engine = create_async_engine(get_database_url(), pool_size=5, max_overflow=10, connect_args={"server_settings": {"search_path": "core"}})
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection verified")
    except Exception as e:
        logger.error("Database connection failed at startup: %s", e)
        engine.dispose()
        raise

    knowledge_client = KnowledgeClient()
    app.state.knowledge_client = knowledge_client
    logger.info("KnowledgeClient initialized")

    app.state.db_engine = engine
    app.state.db_session_factory = session_factory
    yield
    await knowledge_client.close()
    await engine.dispose()


app = FastAPI(title="Core Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(JWTAuthMiddleware)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.http_status,
        content={
            **exc.to_dict(),
            "request_id": request.headers.get("x-request-id", str(uuid.uuid4())),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    safe_errors = [
        {
            "loc": list(e.get("loc", [])),
            "msg": str(e.get("msg", "")),
            "type": str(e.get("type", "")),
        }
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "data": None,
            "detail": {"errors": safe_errors},
            "request_id": request.headers.get("x-request-id", str(uuid.uuid4())),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
    }
    message_map = {
        401: "Authentication required",
        403: "Insufficient permissions",
        404: "Resource not found",
        405: "Method not allowed",
    }
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": code_map.get(exc.status_code, "ERROR"),
            "message": message_map.get(exc.status_code, str(exc.detail) if exc.detail else "Error"),
            "data": None,
            "detail": {},
            "request_id": request.headers.get("x-request-id", str(uuid.uuid4())),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s: %s", type(exc).__name__, exc)
    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "data": None,
            "detail": {},
            "request_id": request.headers.get("x-request-id", str(uuid.uuid4())),
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error("Database error: %s: %s", type(exc).__name__, exc)
    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_ERROR",
            "message": "Internal server error",
            "data": None,
            "detail": {},
            "request_id": request.headers.get("x-request-id", str(uuid.uuid4())),
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(learning_router)
app.include_router(quiz_router)
