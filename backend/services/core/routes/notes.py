"""
C4 Notes management API routes.

9 endpoints covering full lifecycle: CRUD, review pipeline, share card, audit status.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from services.core.clients import KnowledgeClient
from services.core.models import Note, PointsRecord
from services.core.routes.deps import get_db, get_knowledge_client, get_user_id
from shared.errors import NotFoundError
from shared.responses import paginated, success

logger = logging.getLogger("core.notes")

router = APIRouter(prefix="/api/v1/notes", tags=["Notes - C4 Learning Notes"])


# ============================================================
# Pydantic Schemas
# ============================================================


class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    content: str = Field(..., min_length=1)
    tags: list[str] | None = None
    card_id: str | None = None


class NoteUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    content: str | None = None
    tags: list[str] | None = None


# ============================================================
# Helpers
# ============================================================


def _note_to_dict(note: Note) -> dict[str, Any]:
    return {
        "id": note.id,
        "user_id": note.user_id,
        "title": note.title,
        "content": note.content,
        "tags": note.tags or [],
        "associated_card_id": note.associated_card_id,
        "audit_status": note.audit_status,
        "reject_reason": note.reject_reason,
        "violation_flag": note.violation_flag,
        "submitted_at": str(note.submitted_at) if note.submitted_at else None,
        "created_at": str(note.created_at) if note.created_at else None,
        "updated_at": str(note.updated_at) if note.updated_at else None,
    }


def _note_share_dict(note: Note) -> dict[str, Any]:
    """Title first 20 chars, content first 50 chars, full tags."""
    return {
        "title": (note.title or "")[:20],
        "content": (note.content or "")[:50],
        "tags": note.tags or [],
    }


# ============================================================
# Endpoints
# ============================================================


@router.get("")
async def list_notes(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    keyword: str | None = Query(None, min_length=1),
    audit_status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    笔记列表（支持搜索/筛选/分页）。
    - user_id 过滤
    - keyword 模糊搜索 title / content
    - audit_status 筛选
    - 排除软删除笔记
    """
    conditions = [Note.user_id == user_id, Note.deleted_at.is_(None)]

    if keyword:
        conditions.append(
            or_(
                Note.title.ilike(f"%{keyword}%"),
                Note.content.ilike(f"%{keyword}%"),
            )
        )
    if audit_status:
        conditions.append(Note.audit_status == audit_status)

    # Total count
    count_result = await db.execute(select(func.count(Note.id)).where(*conditions))
    total = count_result.scalar() or 0

    # Paginated query
    result = await db.execute(
        select(Note)
        .where(*conditions)
        .order_by(Note.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    notes = result.scalars().all()

    return paginated(
        data=[_note_to_dict(n) for n in notes],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("")
async def create_note(
    body: NoteCreate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    创建笔记。

    自动添加积分记录：
    - create_note（创建笔记，+10 分）
    - learn_card（关联卡片，+5 分，仅当提供 card_id 时）
    """
    note = Note(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=body.title,
        content=body.content,
        tags=body.tags or [],
        associated_card_id=body.card_id,
        audit_status="draft",
    )
    db.add(note)

    # Points: create_note
    db.add(
        PointsRecord(
            user_id=user_id,
            points=10,
            action_type="create_note",
            reference_id=note.id,
            description="创建笔记",
        )
    )

    # Points: learn_card if associated with a card
    if body.card_id:
        db.add(
            PointsRecord(
                user_id=user_id,
                points=5,
                action_type="learn_card",
                reference_id=body.card_id,
                description="关联卡片学习记录",
            )
        )

    await db.commit()
    await db.refresh(note)
    return success({"id": note.id})


@router.get("/audit-status")
async def get_audit_status(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    用户笔记审核状态记录列表。
    仅返回已提交过审核的笔记（排除 draft 状态）。
    """
    conditions = [
        Note.user_id == user_id,
        Note.deleted_at.is_(None),
        Note.audit_status != "draft",
    ]

    count_result = await db.execute(select(func.count(Note.id)).where(*conditions))
    total = count_result.scalar() or 0

    result = await db.execute(
        select(Note)
        .where(*conditions)
        .order_by(Note.submitted_at.desc().nullslast())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    notes = result.scalars().all()

    return paginated(
        data=[_note_to_dict(n) for n in notes],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{note_id}")
async def get_note(
    note_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取笔记详情。"""
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id,
            Note.deleted_at.is_(None),
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise NotFoundError("笔记不存在")

    return success(_note_to_dict(note))


@router.put("/{note_id}")
async def update_note(
    note_id: str,
    body: NoteUpdate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """编辑笔记。"""
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id,
            Note.deleted_at.is_(None),
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise NotFoundError("笔记不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)

    await db.commit()
    await db.refresh(note)
    return success(_note_to_dict(note))


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """软删除笔记（设置 deleted_at）。"""
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id,
            Note.deleted_at.is_(None),
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise NotFoundError("笔记不存在")

    note.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return success({"id": note_id})


@router.post("/{note_id}/submit-review")
async def submit_review(
    note_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
):
    """
    提交笔记到审核流水线。

    调用 KnowledgeClient.submit_review() 执行三级审核，
    根据返回的 status 更新笔记的审核状态：
    - approved      → audit_status = 'approved'
    - rejected      → audit_status = 'rejected' + 记录 reject_reason
    - pending_manual → audit_status = 'reviewing'
    """
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id,
            Note.deleted_at.is_(None),
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise NotFoundError("笔记不存在")

    if note.audit_status not in ("draft", "rejected"):
        raise HTTPException(
            status_code=400,
            detail="仅草稿或已驳回的笔记可提交审核",
        )

    review_result = await client.submit_review(
        note_id=note.id,
        title=note.title,
        content=note.content,
        author_id=user_id,
    )

    status = review_result.get("status")
    if status == "approved":
        note.audit_status = "approved"
    elif status == "rejected":
        note.audit_status = "rejected"
        detail = review_result.get("review_detail") or {}
        note.reject_reason = detail.get("ai_reasoning", "")
    elif status == "pending_manual":
        note.audit_status = "reviewing"

    note.submitted_at = datetime.now(timezone.utc)
    await db.commit()
    return success(review_result)


@router.post("/{note_id}/withdraw-review")
async def withdraw_review(
    note_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """撤回审核中的笔记为 draft 状态。"""
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id,
            Note.deleted_at.is_(None),
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise NotFoundError("笔记不存在")

    if note.audit_status not in ("submitted", "reviewing"):
        raise HTTPException(
            status_code=400,
            detail="仅审核中或已提交的笔记可撤回",
        )

    note.audit_status = "draft"
    note.submitted_at = None
    await db.commit()
    return success({"audit_status": "draft"})


@router.get("/{note_id}/share-card")
async def share_card(
    note_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    返回分享卡片信息。
    - title: 前 20 字
    - content: 前 50 字
    - tags: 完整标签列表
    """
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id,
            Note.deleted_at.is_(None),
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        raise NotFoundError("笔记不存在")

    return success(_note_share_dict(note))
