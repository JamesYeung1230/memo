"""
Admin proxy routes for Knowledge service.

These routes proxy admin requests from Core (port 8000) to Knowledge (port 8002).
All routes require admin JWT auth (enforced by JWTAuthMiddleware).

Prefix: /api/v1/admin

Routes:
  AI Generation:
    POST   /admin/ai/generate-cards
    GET    /admin/ai/generate-cards/{task_id}/result
    POST   /admin/ai/generate-questions/{card_id}

  Review:
    GET    /admin/review/queue
    GET    /admin/review/queue/{note_id}
    POST   /admin/review/queue/batch-approve
    POST   /admin/review/queue/batch-reject
    GET    /admin/review/records
    GET    /admin/review/statistics

  Sensitive Words:
    GET    /admin/sensitive-words
    POST   /admin/sensitive-words
    PUT    /admin/sensitive-words/{word_id}
    DELETE /admin/sensitive-words/{word_id}
    POST   /admin/sensitive-words/batch-delete
    PUT    /admin/sensitive-words/{word_id}/toggle
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.core.clients import KnowledgeClient
from services.core.models import Note
from services.core.routes.deps import get_admin_id, get_db, get_knowledge_client
from shared.errors import NotFoundError, ValidationError
from shared.responses import paginated, success

router = APIRouter(prefix="/api/v1")


# ═════════════════════════════════════════════
#  Schemas
# ═════════════════════════════════════════════


class GenerateCardsRequest(BaseModel):
    topics: list[str] = []
    chapter_id: str
    mode: str = "sync"  # "sync" | "async"
    card_ids: list[str] = []


class GenerateQuestionRequest(BaseModel):
    mode: str = "sync"


class BatchApproveRequest(BaseModel):
    note_ids: list[str]  # webapp sends note_ids, mapped to review_ids for KnowledgeClient


class BatchRejectRequest(BaseModel):
    note_ids: list[str]
    reason: str = ""


class SensitiveWordCreate(BaseModel):
    word: str
    match_mode: str = "exact"  # exact | pinyin | homophone | regex
    enabled: bool = True


class SensitiveWordUpdate(BaseModel):
    word: str | None = None
    match_mode: str | None = None
    enabled: bool | None = None


class ToggleRequest(BaseModel):
    is_active: bool


# ═════════════════════════════════════════════
#  AI Generation
# ═════════════════════════════════════════════


@router.post("/admin/ai/generate-cards")
async def admin_generate_cards(
    body: GenerateCardsRequest,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Generate cards via Knowledge service (sync or async)."""
    if body.mode == "async":
        result = await knowledge.generate_cards_async(
            topics=body.topics,
            chapter_id=body.chapter_id,
        )
    else:
        result = await knowledge.generate_cards_sync(
            topics=body.topics,
            chapter_id=body.chapter_id,
        )
    return success(result)


@router.get("/admin/ai/generate-cards/{task_id}/result")
async def admin_get_generate_cards_result(
    task_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get async card generation task result."""
    result = await knowledge.get_generate_cards_result(task_id)
    return success(result)


@router.post("/admin/ai/generate-questions/{card_id}")
async def admin_generate_questions(
    card_id: str,
    body: GenerateQuestionRequest = GenerateQuestionRequest(),
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Generate questions for a card via Knowledge service."""
    result = await knowledge.generate_question(card_id, mode=body.mode)
    return success(result)


# ═════════════════════════════════════════════
#  Review Queue
# ═════════════════════════════════════════════


@router.get("/admin/review/queue")
async def admin_review_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    keyword: str | None = None,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get paginated review queue from Knowledge service."""
    result = await knowledge.get_review_queue(page=page, page_size=page_size)

    # get_review_queue returns {"items": [...], "total": N}
    # Wrap it in paginated response if it's a dict with items/total
    if isinstance(result, dict) and "items" in result:
        return paginated(
            data=result["items"],
            total=result.get("total", len(result["items"])),
            page=page,
            page_size=page_size,
        )
    # Fallback: if result is a plain list
    if isinstance(result, list):
        return paginated(data=result, total=len(result), page=page, page_size=page_size)
    return success(result)


@router.get("/admin/review/queue/{note_id}")
async def admin_review_detail(
    note_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
    db: AsyncSession = Depends(get_db),
):
    """Get review detail for a note, including note content from Core DB."""
    # Fetch review detail from Knowledge service
    review_detail = await knowledge.get_review_detail(note_id)

    # Also fetch the note content from Core DB (not available via Knowledge)
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()

    if isinstance(review_detail, dict):
        if note:
            review_detail["note_content"] = note.content
            review_detail["note_title"] = review_detail.get("note_title") or note.title
        else:
            review_detail["note_content"] = ""
            review_detail["note_title"] = review_detail.get("note_title") or ""

    return success(review_detail)


@router.post("/admin/review/queue/batch-approve")
async def admin_batch_approve(
    body: BatchApproveRequest,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Batch approve review notes."""
    if not body.note_ids:
        raise ValidationError("note_ids must not be empty")
    result = await knowledge.batch_approve_review(
        review_ids=body.note_ids,
        reviewer=admin_id,
    )
    return success(result)


@router.post("/admin/review/queue/batch-reject")
async def admin_batch_reject(
    body: BatchRejectRequest,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Batch reject review notes."""
    if not body.note_ids:
        raise ValidationError("note_ids must not be empty")
    result = await knowledge.batch_reject_review(
        review_ids=body.note_ids,
        reviewer=admin_id,
        reason=body.reason or "",
    )
    return success(result)


@router.get("/admin/review/records")
async def admin_review_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = "all",
    start_date: str | None = None,
    end_date: str | None = None,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get paginated review records history."""
    result = await knowledge.get_review_records(
        status=status,
        start_date=start_date,
        end_date=end_date,
    )

    # get_review_records returns a list
    if isinstance(result, list):
        # Client-side pagination for list response
        total = len(result)
        start = (page - 1) * page_size
        end = start + page_size
        return paginated(
            data=result[start:end],
            total=total,
            page=page,
            page_size=page_size,
        )
    # If dict with items/total keys
    if isinstance(result, dict) and "items" in result:
        return paginated(
            data=result["items"],
            total=result.get("total", len(result["items"])),
            page=page,
            page_size=page_size,
        )
    return success(result)


@router.get("/admin/review/statistics")
async def admin_review_statistics(
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get review statistics (alias for dashboard/review)."""
    stats = await knowledge.get_review_statistics()
    return success(stats if stats else {})


# ═════════════════════════════════════════════
#  Sensitive Words
# ═════════════════════════════════════════════


@router.get("/admin/sensitive-words")
async def admin_list_sensitive_words(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    match_mode: str | None = None,
    is_active: bool | None = None,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Paginated list of sensitive words."""
    result = await knowledge.list_sensitive_words(
        page=page,
        page_size=page_size,
        keyword=keyword,
        match_mode=match_mode,
    )

    if isinstance(result, dict):
        items = result.get("items", result.get("data", []))
        total = result.get("total", len(items))
        return paginated(data=items, total=total, page=page, page_size=page_size)
    if isinstance(result, list):
        return paginated(data=result, total=len(result), page=page, page_size=page_size)
    return success(result)


@router.post("/admin/sensitive-words")
async def admin_create_sensitive_word(
    body: SensitiveWordCreate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Create a new sensitive word."""
    result = await knowledge.create_sensitive_word(body.model_dump())
    return success(result)


@router.put("/admin/sensitive-words/{word_id}")
async def admin_update_sensitive_word(
    word_id: str,
    body: SensitiveWordUpdate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Update a sensitive word."""
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise ValidationError("No fields to update")
    result = await knowledge.update_sensitive_word(word_id, update_data)
    return success(result)


@router.delete("/admin/sensitive-words/{word_id}")
async def admin_delete_sensitive_word(
    word_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Delete a sensitive word."""
    await knowledge.delete_sensitive_word(word_id)
    return success(None)


@router.post("/admin/sensitive-words/batch-delete")
async def admin_batch_delete_sensitive_words(
    body: BatchApproveRequest,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Batch delete sensitive words."""
    if not body.note_ids:
        raise ValidationError("ids must not be empty")
    await knowledge.batch_delete_sensitive_words(body.note_ids)
    return success(None)


@router.put("/admin/sensitive-words/{word_id}/toggle")
async def admin_toggle_sensitive_word(
    word_id: str,
    body: ToggleRequest,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Toggle sensitive word enabled/disabled."""
    result = await knowledge.toggle_sensitive_word(word_id, body.is_active)
    return success(result)
