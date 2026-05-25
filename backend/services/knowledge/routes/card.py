from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, update, or_
from sqlalchemy.ext.asyncio import AsyncSession

from services.knowledge.models import Card, Chapter
from services.knowledge.routes.deps import get_db
from shared.errors import KnowledgeNotFoundError
from shared.responses import success, paginated

router = APIRouter(prefix="/api/v1", tags=["Content - Cards"])


# ---- Pydantic Schemas ----

class CardCreate(BaseModel):
    chapter_id: str
    title: str = Field(min_length=1, max_length=200)
    core_concept: str = Field(min_length=1, max_length=200)
    detail: str = Field(min_length=1)
    life_analogy: str = Field(min_length=1)
    tags: list[str] = []
    difficulty: str = "beginner"
    is_premium: bool = False
    unlock_points: int | None = None
    status: str = "draft"


class CardUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    core_concept: str | None = Field(None, min_length=1, max_length=200)
    detail: str | None = None
    life_analogy: str | None = None
    tags: list[str] | None = None
    difficulty: str | None = None
    is_premium: bool | None = None
    unlock_points: int | None = None
    status: str | None = None


class ToggleStatus(BaseModel):
    status: str


def _to_out(c: Card) -> dict:
    return {
        "id": c.id,
        "chapter_id": c.chapter_id,
        "title": c.title,
        "core_concept": c.core_concept,
        "detail": c.detail,
        "life_analogy": c.life_analogy,
        "tags": c.tags if isinstance(c.tags, list) else [],
        "difficulty": c.difficulty,
        "is_premium": c.is_premium,
        "unlock_points": c.unlock_points,
        "status": c.status,
        "created_at": str(c.created_at) if hasattr(c, 'created_at') and c.created_at else None,
        "updated_at": str(c.updated_at) if hasattr(c, 'updated_at') and c.updated_at else None,
    }


def _to_list_out(c: Card) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "core_concept": c.core_concept,
        "difficulty": c.difficulty,
        "is_premium": c.is_premium,
        "unlock_points": c.unlock_points,
        "tags": c.tags if isinstance(c.tags, list) else [],
        "status": c.status,
    }


# ---- Routes ----

@router.get("/chapters/{chapter_id}/cards")
async def list_cards(
    chapter_id: str,
    status: str | None = Query(None, description="all 表示全部"),
    keyword: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    # 验证章节存在
    chapter_result = await session.execute(select(Chapter).where(Chapter.id == chapter_id))
    if not chapter_result.scalar_one_or_none():
        raise KnowledgeNotFoundError()

    query = select(Card).where(Card.chapter_id == chapter_id, Card.deleted_at.is_(None))
    count_query = select(func.count(Card.id)).where(Card.chapter_id == chapter_id, Card.deleted_at.is_(None))

    if status and status != "all":
        query = query.where(Card.status == status)
        count_query = count_query.where(Card.status == status)

    if keyword:
        kw_filter = or_(Card.title.ilike(f"%{keyword}%"), Card.core_concept.ilike(f"%{keyword}%"))
        query = query.where(kw_filter)
        count_query = count_query.where(kw_filter)

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    result = await session.execute(
        query.order_by(Card.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    cards = result.scalars().all()

    return paginated([_to_list_out(c) for c in cards], total, page, page_size)


@router.get("/cards/{card_id}")
async def get_card(
    card_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Card).where(Card.id == card_id, Card.deleted_at.is_(None))
    )
    card = result.scalar_one_or_none()
    if not card:
        raise KnowledgeNotFoundError()

    return success(_to_out(card))


@router.post("/cards", status_code=201)
async def create_card(
    body: CardCreate,
    session: AsyncSession = Depends(get_db),
):
    # 验证章节存在
    chapter_result = await session.execute(select(Chapter).where(Chapter.id == body.chapter_id))
    if not chapter_result.scalar_one_or_none():
        raise KnowledgeNotFoundError()

    card = Card(
        chapter_id=body.chapter_id,
        title=body.title,
        core_concept=body.core_concept,
        detail=body.detail,
        life_analogy=body.life_analogy,
        tags=body.tags,
        difficulty=body.difficulty,
        is_premium=body.is_premium,
        unlock_points=body.unlock_points,
        status=body.status,
    )
    session.add(card)
    await session.commit()
    await session.refresh(card)

    return success(_to_out(card))


@router.put("/cards/{card_id}")
async def update_card(
    card_id: str,
    body: CardUpdate,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Card).where(Card.id == card_id, Card.deleted_at.is_(None))
    )
    card = result.scalar_one_or_none()
    if not card:
        raise KnowledgeNotFoundError()

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(card, key, value)

    await session.commit()
    await session.refresh(card)
    return success(_to_out(card))


@router.delete("/cards/{card_id}", status_code=204)
async def delete_card(
    card_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Card).where(Card.id == card_id))
    card = result.scalar_one_or_none()
    if not card:
        raise KnowledgeNotFoundError()

    # 软删除
    from sqlalchemy import func as sa_func
    card.deleted_at = sa_func.now()
    await session.commit()
    return None


@router.put("/cards/{card_id}/toggle-status")
async def toggle_card_status(
    card_id: str,
    body: ToggleStatus,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(Card).where(Card.id == card_id, Card.deleted_at.is_(None))
    )
    card = result.scalar_one_or_none()
    if not card:
        raise KnowledgeNotFoundError()

    card.status = body.status
    await session.commit()
    return success({"id": card.id, "status": card.status})
