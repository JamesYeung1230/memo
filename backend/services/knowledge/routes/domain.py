from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, update, delete, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from services.knowledge.models import Domain
from services.knowledge.routes.deps import get_db
from shared.errors import (
    AppException, ErrorCodes,
    KnowledgeNotFoundError, KnowledgeDuplicateError,
)
from shared.responses import success, paginated

router = APIRouter(prefix="/api/v1", tags=["Content - Domains"])


# ---- Pydantic Schemas ----

class DomainCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    icon: str = Field(min_length=1, max_length=50)
    is_free: bool = True
    unlock_points: int | None = None
    status: str = "published"


class DomainUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    icon: str | None = Field(None, min_length=1, max_length=50)
    is_free: bool | None = None
    unlock_points: int | None = None
    status: str | None = None


class DomainReorder(BaseModel):
    order: list[str]


class DomainOut(BaseModel):
    id: str
    name: str
    icon: str
    sort_order: int
    is_free: bool
    unlock_points: int | None
    status: str
    created_at: str | None = None
    updated_at: str | None = None


class DomainListOut(DomainOut):
    chapter_count: int = 0
    total_card_count: int = 0


# ---- Helper ----

def _domain_to_out(d: Domain) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "icon": d.icon,
        "sort_order": d.sort_order,
        "is_free": d.is_free,
        "unlock_points": d.unlock_points,
        "status": d.status,
        "created_at": str(d.created_at) if hasattr(d, 'created_at') and d.created_at else None,
        "updated_at": str(d.updated_at) if hasattr(d, 'updated_at') and d.updated_at else None,
    }


# ---- Routes ----

@router.get("/domains")
async def list_domains(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    query = select(Domain).order_by(Domain.sort_order)
    count_query = select(func.count(Domain.id))

    if status:
        query = query.where(Domain.status == status)
        count_query = count_query.where(Domain.status == status)

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    result = await session.execute(
        query.offset((page - 1) * page_size).limit(page_size)
    )
    domains = result.scalars().all()

    return paginated([_domain_to_out(d) for d in domains], total, page, page_size)


@router.get("/domains/{domain_id}")
async def get_domain(
    domain_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Domain).where(Domain.id == domain_id))
    domain = result.scalar_one_or_none()
    if not domain:
        raise KnowledgeNotFoundError()

    return success(_domain_to_out(domain))


@router.post("/domains", status_code=201)
async def create_domain(
    body: DomainCreate,
    session: AsyncSession = Depends(get_db),
):
    # 检查名称是否已存在
    existing = await session.execute(
        select(Domain).where(Domain.name == body.name)
    )
    if existing.scalar_one_or_none():
        raise KnowledgeDuplicateError()

    max_order = await session.execute(
        select(func.coalesce(func.max(Domain.sort_order), -1) + 1)
    )
    next_order = max_order.scalar()

    domain = Domain(
        name=body.name,
        icon=body.icon,
        sort_order=next_order,
        is_free=body.is_free,
        unlock_points=body.unlock_points,
        status=body.status,
    )
    session.add(domain)
    await session.commit()
    await session.refresh(domain)

    return success(_domain_to_out(domain))


@router.put("/domains/{domain_id}")
async def update_domain(
    domain_id: str,
    body: DomainUpdate,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Domain).where(Domain.id == domain_id))
    domain = result.scalar_one_or_none()
    if not domain:
        raise KnowledgeNotFoundError()

    # 检查名称是否与其他领域冲突
    if body.name is not None and body.name != domain.name:
        existing = await session.execute(
            select(Domain).where(Domain.name == body.name, Domain.id != domain_id)
        )
        if existing.scalar_one_or_none():
            raise KnowledgeDuplicateError()

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(domain, key, value)

    await session.commit()
    await session.refresh(domain)
    return success(_domain_to_out(domain))


@router.delete("/domains/{domain_id}", status_code=204)
async def delete_domain(
    domain_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Domain).where(Domain.id == domain_id))
    domain = result.scalar_one_or_none()
    if not domain:
        raise KnowledgeNotFoundError()

    await session.delete(domain)
    await session.commit()
    return None


@router.put("/domains/reorder")
async def reorder_domains(
    body: DomainReorder,
    session: AsyncSession = Depends(get_db),
):
    for idx, domain_id in enumerate(body.order):
        await session.execute(
            update(Domain).where(Domain.id == domain_id).values(sort_order=idx)
        )
    await session.commit()
    return success({"message": "Reorder successful"})


@router.put("/domains/{domain_id}/toggle-status")
async def toggle_domain_status(
    domain_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Domain).where(Domain.id == domain_id))
    domain = result.scalar_one_or_none()
    if not domain:
        raise KnowledgeNotFoundError()

    new_status = "draft" if domain.status == "published" else "published"
    domain.status = new_status
    await session.commit()
    return success({"id": domain.id, "status": new_status})
