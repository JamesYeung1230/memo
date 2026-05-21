from fastapi import Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from services.core.clients import KnowledgeClient


async def get_db(request: Request) -> AsyncSession:
    session_factory: async_sessionmaker = request.app.state.db_session_factory
    async with session_factory() as session:
        yield session


async def get_knowledge_client(request: Request) -> KnowledgeClient:
    client: KnowledgeClient = request.app.state.knowledge_client
    yield client


async def get_user_id(request: Request) -> str:
    return getattr(request.state, "user_id", "anonymous")


async def get_admin_id(request: Request) -> str:
    return getattr(request.state, "admin_id", "anonymous")
