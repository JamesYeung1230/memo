from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from services.knowledge.models import Chapter, Domain
from services.knowledge.routes.deps import get_db
from shared.errors import KnowledgeNotFoundError, KnowledgeDuplicateError
from shared.responses import success, paginated

router = APIRouter(prefix="/api/v1", tags=["Content - Chapters"])


# ---- Pydantic Schemas ----

class ChapterCreate(BaseModel):
    domain_id: str
    name: str = Field(min_length=1, max_length=100)
    status: str = "published"


class ChapterUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    status: str | None = None


class ChapterReorder(BaseModel):
    order: list[str]


def _to_out(c: Chapter) -> dict:
    return {
        "id": c.id,
        "domain_id": c.domain_id,
        "name": c.name,
        "sort_order": c.sort_order,
        "status": c.status,
        "created_at": str(c.created_at) if hasattr(c, 'created_at') and c.created_at else None,
        "updated_at": str(c.updated_at) if hasattr(c, 'updated_at') and c.updated_at else None,
    }


# ---- Routes ----

@router.get("/domains/{domain_id}/chapters")
async def list_chapters(
    domain_id: str,
    status: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    # 验证领域存在
    domain_result = await session.execute(select(Domain).where(Domain.id == domain_id))
    if not domain_result.scalar_one_or_none():
        raise KnowledgeNotFoundError()

    query = select(Chapter).where(Chapter.domain_id == domain_id).order_by(Chapter.sort_order)
    if status:
        query = query.where(Chapter.status == status)

    result = await session.execute(query)
    chapters = result.scalars().all()

    return success([_to_out(c) for c in chapters])


@router.get("/chapters/{chapter_id}")
async def get_chapter(
    chapter_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Chapter).where(Chapter.id == chapter_id))
    chapter = result.scalar_one_or_none()
    if not chapter:
        raise KnowledgeNotFoundError()

    return success(_to_out(chapter))


@router.post("/chapters", status_code=201)
async def create_chapter(
    body: ChapterCreate,
    session: AsyncSession = Depends(get_db),
):
    # 验证领域存在
    domain_result = await session.execute(select(Domain).where(Domain.id == body.domain_id))
    if not domain_result.scalar_one_or_none():
        raise KnowledgeNotFoundError()

    # 检查同领域下章节名不重复
    existing = await session.execute(
        select(Chapter).where(
            Chapter.domain_id == body.domain_id,
            Chapter.name == body.name,
        )
    )
    if existing.scalar_one_or_none():
        raise KnowledgeDuplicateError()

    max_order = await session.execute(
        select(func.coalesce(func.max(Chapter.sort_order), -1) + 1)
        .where(Chapter.domain_id == body.domain_id)
    )
    next_order = max_order.scalar()

    chapter = Chapter(
        domain_id=body.domain_id,
        name=body.name,
        sort_order=next_order,
        status=body.status,
    )
    session.add(chapter)
    await session.commit()
    await session.refresh(chapter)

    return success(_to_out(chapter))


@router.put("/chapters/{chapter_id}")
async def update_chapter(
    chapter_id: str,
    body: ChapterUpdate,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Chapter).where(Chapter.id == chapter_id))
    chapter = result.scalar_one_or_none()
    if not chapter:
        raise KnowledgeNotFoundError()

    if body.name is not None and body.name != chapter.name:
        existing = await session.execute(
            select(Chapter).where(
                Chapter.domain_id == chapter.domain_id,
                Chapter.name == body.name,
                Chapter.id != chapter_id,
            )
        )
        if existing.scalar_one_or_none():
            raise KnowledgeDuplicateError()

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(chapter, key, value)

    await session.commit()
    await session.refresh(chapter)
    return success(_to_out(chapter))


@router.delete("/chapters/{chapter_id}", status_code=204)
async def delete_chapter(
    chapter_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Chapter).where(Chapter.id == chapter_id))
    chapter = result.scalar_one_or_none()
    if not chapter:
        raise KnowledgeNotFoundError()

    await session.delete(chapter)
    await session.commit()
    return None


@router.put("/chapters/reorder")
async def reorder_chapters(
    body: ChapterReorder,
    session: AsyncSession = Depends(get_db),
):
    for idx, chapter_id in enumerate(body.order):
        await session.execute(
            update(Chapter).where(Chapter.id == chapter_id).values(sort_order=idx)
        )
    await session.commit()
    return success({"message": "Reorder successful"})
