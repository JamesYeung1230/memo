import json
import logging

import redis.asyncio as redis
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from services.knowledge.models import SensitiveWord
from services.knowledge.routes.deps import get_db
from shared.config import get_redis_url
from shared.errors import KnowledgeNotFoundError
from shared.responses import success, paginated

logger = logging.getLogger("knowledge.sensitive_words")

router = APIRouter(prefix="/api/v1/sensitive-words", tags=["Sensitive Words"])


# ---- Pydantic Schemas ----

class SensitiveWordCreate(BaseModel):
    word: str = Field(min_length=1, max_length=100)
    match_mode: str = "exact"
    enabled: bool = True


class SensitiveWordUpdate(BaseModel):
    word: str | None = Field(None, min_length=1, max_length=100)
    match_mode: str | None = None
    enabled: bool | None = None


class BatchDelete(BaseModel):
    ids: list[str]


class ToggleRequest(BaseModel):
    enabled: bool


# ---- Helper ----

def _to_out(w: SensitiveWord) -> dict:
    return {
        "id": w.id,
        "word": w.word,
        "match_mode": w.match_mode,
        "enabled": w.enabled,
        "created_at": str(w.created_at) if hasattr(w, 'created_at') and w.created_at else None,
        "updated_at": str(w.updated_at) if hasattr(w, 'updated_at') and w.updated_at else None,
    }


async def _reload_redis_cache(session: AsyncSession) -> int:
    """Reload all enabled sensitive words into Redis."""
    result = await session.execute(
        select(SensitiveWord).where(SensitiveWord.enabled == True)  # noqa: E712
    )
    words = result.scalars().all()

    word_list = [{"word": w.word, "match_mode": w.match_mode} for w in words]
    try:
        r = redis.Redis.from_url(get_redis_url(), decode_responses=True)
        await r.set("sensitive_words:all", json.dumps(word_list, ensure_ascii=False))
        await r.close()
    except Exception as e:
        logger.warning("Redis cache sync failed (non-critical): %s", e)

    return len(word_list)


# ---- Routes ----

@router.get("")
async def list_sensitive_words(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    match_mode: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    query = select(SensitiveWord).order_by(SensitiveWord.created_at.desc())
    count_query = select(func.count(SensitiveWord.id))

    if keyword:
        query = query.where(SensitiveWord.word.ilike(f"%{keyword}%"))
        count_query = count_query.where(SensitiveWord.word.ilike(f"%{keyword}%"))
    if match_mode:
        query = query.where(SensitiveWord.match_mode == match_mode)
        count_query = count_query.where(SensitiveWord.match_mode == match_mode)

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    result = await session.execute(
        query.offset((page - 1) * page_size).limit(page_size)
    )
    words = result.scalars().all()

    return paginated([_to_out(w) for w in words], total, page, page_size)


@router.get("/{word_id}")
async def get_sensitive_word(
    word_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(SensitiveWord).where(SensitiveWord.id == word_id))
    word = result.scalar_one_or_none()
    if not word:
        raise KnowledgeNotFoundError()
    return success(_to_out(word))


@router.post("", status_code=201)
async def create_sensitive_word(
    body: SensitiveWordCreate,
    session: AsyncSession = Depends(get_db),
):
    word = SensitiveWord(
        word=body.word,
        match_mode=body.match_mode,
        enabled=body.enabled,
    )
    session.add(word)
    await session.commit()
    await session.refresh(word)
    return success(_to_out(word))


@router.put("/{word_id}")
async def update_sensitive_word(
    word_id: str,
    body: SensitiveWordUpdate,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(SensitiveWord).where(SensitiveWord.id == word_id))
    word = result.scalar_one_or_none()
    if not word:
        raise KnowledgeNotFoundError()

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(word, key, value)

    await session.commit()
    await session.refresh(word)
    return success(_to_out(word))


@router.delete("/{word_id}", status_code=204)
async def delete_sensitive_word(
    word_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(SensitiveWord).where(SensitiveWord.id == word_id))
    word = result.scalar_one_or_none()
    if not word:
        raise KnowledgeNotFoundError()

    await session.delete(word)
    await session.commit()
    return None


@router.post("/batch-delete")
async def batch_delete_sensitive_words(
    body: BatchDelete,
    session: AsyncSession = Depends(get_db),
):
    await session.execute(
        delete(SensitiveWord).where(SensitiveWord.id.in_(body.ids))
    )
    await session.commit()
    return success({"deleted_count": len(body.ids)})


@router.put("/{word_id}/toggle")
async def toggle_sensitive_word(
    word_id: str,
    body: ToggleRequest,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(SensitiveWord).where(SensitiveWord.id == word_id))
    word = result.scalar_one_or_none()
    if not word:
        raise KnowledgeNotFoundError()

    word.enabled = body.enabled
    await session.commit()
    return success({"id": word.id, "enabled": word.enabled})


@router.post("/reload")
async def reload_sensitive_words(
    session: AsyncSession = Depends(get_db),
):
    count = await _reload_redis_cache(session)
    return success({"message": "Cache reloaded", "word_count": count})
