"""
Admin proxy routes for Knowledge service.

These routes proxy admin requests from Core (port 8000) to Knowledge (port 8002).
All routes require admin JWT auth (enforced by JWTAuthMiddleware).

Prefix: /api/v1/admin

Routes (40 total):
  Content — Domains:
    GET    /admin/domains
    GET    /admin/domains/{domain_id}
    POST   /admin/domains
    PUT    /admin/domains/{domain_id}
    DELETE /admin/domains/{domain_id}
    PUT    /admin/domains/reorder
    PUT    /admin/domains/{domain_id}/toggle

  Content — Chapters:
    GET    /admin/domains/{domain_id}/chapters
    GET    /admin/chapters
    GET    /admin/chapters/{chapter_id}
    POST   /admin/chapters
    PUT    /admin/chapters/{chapter_id}
    DELETE /admin/chapters/{chapter_id}
    PUT    /admin/chapters/reorder

  Content — Cards:
    GET    /admin/cards
    GET    /admin/cards/{card_id}
    POST   /admin/cards
    PUT    /admin/cards/{card_id}
    DELETE /admin/cards/{card_id}
    PUT    /admin/cards/{card_id}/toggle

  Content — Questions:
    GET    /admin/questions
    GET    /admin/questions/{question_id}
    POST   /admin/questions
    PUT    /admin/questions/{question_id}
    DELETE /admin/questions/{question_id}

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


# ═════════════════════════════════════════════
#  Content Management — Domains
# ═════════════════════════════════════════════


class DomainCreate(BaseModel):
    name: str
    icon: str = "📚"
    is_free: bool = True
    unlock_points: int | None = None
    status: str = "published"


class DomainUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    is_free: bool | None = None
    unlock_points: int | None = None
    status: str | None = None


class DomainReorder(BaseModel):
    order: list[str]


@router.get("/admin/domains")
async def admin_list_domains(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Paginated list of domains. Uses Knowledge pagination directly."""
    # Use raw httpx call to support optional status filter
    params: dict = {"page": page, "page_size": page_size}
    if status:
        params["status"] = status
    resp = await knowledge.client.get("/api/v1/domains", params=params)
    resp.raise_for_status()
    body = resp.json()
    items = body.get("data", [])
    meta = body.get("meta", {})
    return paginated(
        data=items,
        total=meta.get("total", len(items)),
        page=meta.get("page", page),
        page_size=meta.get("page_size", page_size),
    )


@router.get("/admin/domains/{domain_id}")
async def admin_get_domain(
    domain_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get single domain detail."""
    resp = await knowledge.client.get(f"/api/v1/domains/{domain_id}")
    resp.raise_for_status()
    return success(resp.json().get("data"))


@router.post("/admin/domains", status_code=201)
async def admin_create_domain(
    body: DomainCreate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Create a new domain."""
    result = await knowledge.create_domain(body.model_dump())
    return success(result)


@router.put("/admin/domains/{domain_id}")
async def admin_update_domain(
    domain_id: str,
    body: DomainUpdate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Update a domain."""
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise ValidationError("No fields to update")
    result = await knowledge.update_domain(domain_id, update_data)
    return success(result)


@router.delete("/admin/domains/{domain_id}")
async def admin_delete_domain(
    domain_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Delete a domain."""
    await knowledge.delete_domain(domain_id)
    return success(None)


@router.put("/admin/domains/reorder")
async def admin_reorder_domains(
    body: DomainReorder,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Reorder domains."""
    if not body.order:
        raise ValidationError("order must not be empty")
    result = await knowledge.reorder_domains(body.order)
    return success(result)


@router.put("/admin/domains/{domain_id}/toggle")
async def admin_toggle_domain(
    domain_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Toggle domain published/draft status."""
    result = await knowledge.toggle_domain_status(domain_id)
    return success(result)


# ═════════════════════════════════════════════
#  Content Management — Chapters
# ═════════════════════════════════════════════


class ChapterCreate(BaseModel):
    name: str
    domain_id: str
    status: str = "published"


class ChapterUpdate(BaseModel):
    name: str | None = None
    domain_id: str | None = None
    status: str | None = None


class ChapterReorder(BaseModel):
    order: list[str]


@router.get("/admin/domains/{domain_id}/chapters")
async def admin_list_chapters(
    domain_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """List chapters under a domain."""
    chapters = await knowledge.list_chapters(domain_id)
    if not isinstance(chapters, list):
        chapters = []
    return success(chapters)


@router.get("/admin/chapters")
async def admin_list_all_chapters(
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """List all chapters across all domains (for dropdowns)."""
    # Raw call: KnowledgeClient's get_domains always filters by status
    domains_resp = await knowledge.client.get("/api/v1/domains", params={"page_size": 100})
    domains_resp.raise_for_status()
    domains = domains_resp.json().get("data", [])
    if not isinstance(domains, list):
        domains = []
    all_chapters = []
    for d in domains:
        chapters = await knowledge.list_chapters(d["id"])
        if isinstance(chapters, list):
            for ch in chapters:
                ch["domain_name"] = d.get("name", "")
            all_chapters.extend(chapters)
    return success(all_chapters)


@router.get("/admin/chapters/{chapter_id}")
async def admin_get_chapter(
    chapter_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get single chapter detail."""
    result = await knowledge.get_chapter_detail(chapter_id)
    return success(result)


@router.post("/admin/chapters", status_code=201)
async def admin_create_chapter(
    body: ChapterCreate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Create a new chapter."""
    result = await knowledge.create_chapter(body.model_dump())
    return success(result)


@router.put("/admin/chapters/{chapter_id}")
async def admin_update_chapter(
    chapter_id: str,
    body: ChapterUpdate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Update a chapter."""
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise ValidationError("No fields to update")
    result = await knowledge.update_chapter(chapter_id, update_data)
    return success(result)


@router.delete("/admin/chapters/{chapter_id}")
async def admin_delete_chapter(
    chapter_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Delete a chapter."""
    await knowledge.delete_chapter(chapter_id)
    return success(None)


@router.put("/admin/chapters/reorder")
async def admin_reorder_chapters(
    body: ChapterReorder,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Reorder chapters."""
    if not body.order:
        raise ValidationError("order must not be empty")
    result = await knowledge.reorder_chapters(body.order)
    return success(result)


# ═════════════════════════════════════════════
#  Content Management — Cards
# ═════════════════════════════════════════════


class CardCreate(BaseModel):
    chapter_id: str
    title: str
    core_concept: str
    detail: str
    life_analogy: str = ""
    tags: list[str] = []
    difficulty: str = "beginner"
    is_premium: bool = False
    unlock_points: int | None = None
    status: str = "draft"


class CardUpdate(BaseModel):
    title: str | None = None
    core_concept: str | None = None
    detail: str | None = None
    life_analogy: str | None = None
    tags: list[str] | None = None
    difficulty: str | None = None
    is_premium: bool | None = None
    unlock_points: int | None = None
    status: str | None = None


class CardToggle(BaseModel):
    status: str


@router.get("/admin/cards")
async def admin_list_cards(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    chapter_id: str | None = None,
    domain_id: str | None = None,
    status: str | None = None,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Paginated card list with filters. Supports chapter-scoped and cross-chapter listing."""
    if chapter_id:
        cards = await knowledge.list_cards(chapter_id, status=status or "all", keyword=keyword)
        if not isinstance(cards, list):
            cards = []
        total = len(cards)
        start = (page - 1) * page_size
        end = start + page_size
        return paginated(data=cards[start:end], total=total, page=page, page_size=page_size)

    # Cross-chapter listing: collect all cards under matching domains/chapters
    # Raw call: KnowledgeClient's get_domains always filters by status
    domains_resp = await knowledge.client.get("/api/v1/domains", params={"page_size": 100})
    domains_resp.raise_for_status()
    domains = domains_resp.json().get("data", [])
    if not isinstance(domains, list):
        domains = []

    all_cards = []
    for d in domains:
        if domain_id and d["id"] != domain_id:
            continue
        chapters = await knowledge.list_chapters(d["id"])
        if not isinstance(chapters, list):
            continue
        for ch in chapters:
            cards = await knowledge.list_cards(ch["id"], status=status or "all", keyword=keyword)
            if isinstance(cards, list):
                for c in cards:
                    c["domain_name"] = d.get("name", "")
                    c["chapter_name"] = ch.get("name", "")
                all_cards.extend(cards)

    total = len(all_cards)
    start = (page - 1) * page_size
    end = start + page_size
    return paginated(data=all_cards[start:end], total=total, page=page, page_size=page_size)


@router.get("/admin/cards/{card_id}")
async def admin_get_card(
    card_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get single card detail."""
    result = await knowledge.get_card_detail(card_id)
    return success(result)


@router.post("/admin/cards", status_code=201)
async def admin_create_card(
    body: CardCreate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Create a new card."""
    result = await knowledge.create_card(body.model_dump())
    return success(result)


@router.put("/admin/cards/{card_id}")
async def admin_update_card(
    card_id: str,
    body: CardUpdate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Update a card."""
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise ValidationError("No fields to update")
    result = await knowledge.update_card(card_id, update_data)
    return success(result)


@router.delete("/admin/cards/{card_id}")
async def admin_delete_card(
    card_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Delete a card (soft delete)."""
    await knowledge.delete_card(card_id)
    return success(None)


@router.put("/admin/cards/{card_id}/toggle")
async def admin_toggle_card(
    card_id: str,
    body: CardToggle,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Toggle card status."""
    result = await knowledge.toggle_card_status(card_id, body.status)
    return success(result)


# ═════════════════════════════════════════════
#  Content Management — Questions
# ═════════════════════════════════════════════


class QuestionCreate(BaseModel):
    card_id: str
    question_text: str
    options: dict
    correct_option: str
    explanation: str


class QuestionUpdate(BaseModel):
    question_text: str | None = None
    options: dict | None = None
    correct_option: str | None = None
    explanation: str | None = None


@router.get("/admin/questions")
async def admin_list_questions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    card_id: str | None = None,
    domain_id: str | None = None,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Paginated question list. Supports card-scoped and cross-card listing."""
    if card_id:
        question = await knowledge.get_card_question(card_id)
        items = [question] if question else []
        return paginated(data=items, total=len(items), page=page, page_size=page_size)

    # Cross-card listing: collect all questions from all cards
    # Raw call: KnowledgeClient's get_domains always filters by status
    domains_resp = await knowledge.client.get("/api/v1/domains", params={"page_size": 100})
    domains_resp.raise_for_status()
    domains = domains_resp.json().get("data", [])
    if not isinstance(domains, list):
        domains = []

    all_questions = []
    for d in domains:
        if domain_id and d["id"] != domain_id:
            continue
        chapters = await knowledge.list_chapters(d["id"])
        if not isinstance(chapters, list):
            continue
        for ch in chapters:
            cards = await knowledge.list_cards(ch["id"], status="all")
            if not isinstance(cards, list):
                continue
            for c in cards:
                try:
                    question = await knowledge.get_card_question(c["id"])
                    if question and isinstance(question, dict):
                        question["card_title"] = c.get("title", "")
                        question["domain_name"] = d.get("name", "")
                        if keyword:
                            q_text = question.get("question_text", "")
                            if keyword.lower() not in q_text.lower():
                                continue
                        all_questions.append(question)
                except Exception:
                    # Card may not have a question yet — skip
                    pass

    total = len(all_questions)
    start = (page - 1) * page_size
    end = start + page_size
    return paginated(data=all_questions[start:end], total=total, page=page, page_size=page_size)


@router.get("/admin/questions/{question_id}")
async def admin_get_question(
    question_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get single question detail."""
    result = await knowledge.get_question_detail(question_id)
    return success(result)


@router.post("/admin/questions", status_code=201)
async def admin_create_question(
    body: QuestionCreate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Create a new question for a card."""
    result = await knowledge.create_question(body.model_dump())
    return success(result)


@router.put("/admin/questions/{question_id}")
async def admin_update_question(
    question_id: str,
    body: QuestionUpdate,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Update a question."""
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise ValidationError("No fields to update")
    result = await knowledge.update_question(question_id, update_data)
    return success(result)


@router.delete("/admin/questions/{question_id}")
async def admin_delete_question(
    question_id: str,
    admin_id: str = Depends(get_admin_id),
    knowledge: KnowledgeClient = Depends(get_knowledge_client),
):
    """Delete a question."""
    await knowledge.delete_question(question_id)
    return success(None)
