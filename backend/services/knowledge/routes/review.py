import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func, delete, update, or_
from sqlalchemy.ext.asyncio import AsyncSession

from services.knowledge.ai import get_provider
from services.knowledge.models import ReviewRecord, SensitiveWord
from services.knowledge.routes.deps import get_db
from shared.errors import KnowledgeNotFoundError, AppException, ErrorCodes
from shared.responses import success, paginated

router = APIRouter(prefix="/api/v1/review", tags=["Review - Note Review"])


# ---- Pydantic Schemas ----

class SubmitReviewRequest(BaseModel):
    note_id: str
    title: str
    content: str
    author_id: str


class ManualReviewRequest(BaseModel):
    reviewer: str
    reason: str | None = None


class BatchReviewRequest(BaseModel):
    review_ids: list[str]
    reviewer: str
    reason: str | None = None


# ---- Helper ----

def _to_status_out(r: ReviewRecord) -> dict:
    return {
        "note_id": r.note_id,
        "review_id": r.id,
        "status": r.status,
        "risk_score": r.risk_score,
        "reject_reason": r.manual_reason if r.status == "rejected" else None,
    }


def _to_detail_out(r: ReviewRecord) -> dict:
    return {
        "review_id": r.id,
        "note_id": r.note_id,
        "status": r.status,
        "sensitive_words_hit": r.sensitive_words_hit if isinstance(r.sensitive_words_hit, list) else [],
        "ai_risk_score": r.ai_risk_score,
        "ai_risk_labels": r.ai_risk_labels if isinstance(r.ai_risk_labels, list) else [],
        "ai_reasoning": r.ai_reasoning or "",
        "manual_reviewer": r.manual_reviewer,
        "manual_result": r.manual_result,
        "manual_reason": r.manual_reason,
        "reviewed_at": str(r.reviewed_at) if hasattr(r, 'reviewed_at') and r.reviewed_at else None,
    }


def _to_record_out(r: ReviewRecord) -> dict:
    return {
        "id": r.id,
        "note_id": r.note_id,
        "author_id": r.author_id,
        "note_title": r.note_title,
        "status": r.status,
        "risk_score": r.risk_score,
        "manual_reviewer": r.manual_reviewer,
        "manual_result": r.manual_result,
        "manual_reason": r.manual_reason,
        "reviewed_at": str(r.reviewed_at) if hasattr(r, 'reviewed_at') and r.reviewed_at else None,
        "created_at": str(r.created_at) if hasattr(r, 'created_at') and r.created_at else None,
    }


async def _check_sensitive_words(content: str, session: AsyncSession) -> list[dict]:
    """Check content against enabled sensitive words."""
    result = await session.execute(
        select(SensitiveWord).where(SensitiveWord.enabled == True)  # noqa: E712
    )
    words = result.scalars().all()
    hits = []
    for w in words:
        if w.word in content:
            hits.append({"word": w.word, "match_mode": w.match_mode})
    return hits


async def _run_ai_review(title: str, content: str) -> dict:
    """Run AI review using configured provider."""
    provider = get_provider()
    result = await provider.review_note(title, content)
    return {
        "risk_score": result.risk_score,
        "risk_labels": result.risk_labels,
        "ai_reasoning": result.review_detail.get("ai_reasoning", ""),
        "needs_manual_review": result.review_detail.get("needs_manual_review", False),
        "reject_reason": result.review_detail.get("reject_reason"),
    }


# ---- Routes ----

@router.post("/notes/{note_id}/submit")
async def submit_review(
    note_id: str,
    body: SubmitReviewRequest,
    session: AsyncSession = Depends(get_db),
):
    """Submit a note for the 3-stage review pipeline."""
    # Stage 1: Sensitive word screening
    sensitive_hits = await _check_sensitive_words(body.content, session)
    status = "approved"
    risk_score = 0
    risk_labels = []
    ai_reasoning = ""
    needs_manual_review = False
    reject_reason = None

    if sensitive_hits:
        status = "rejected"
        risk_score = 80
        risk_labels = ["违规广告"]
        ai_reasoning = f"命中敏感词: {', '.join([h['word'] for h in sensitive_hits])}"
        reject_reason = "内容包含违规信息"

    # Stage 2: AI review (if passed sensitive screening)
    if status != "rejected":
        try:
            ai_result = await _run_ai_review(body.title, body.content)
            risk_score = ai_result["risk_score"]
            risk_labels = ai_result["risk_labels"]
            ai_reasoning = ai_result["ai_reasoning"]
            needs_manual_review = ai_result["needs_manual_review"]

            if ai_result.get("reject_reason"):
                status = "rejected"
                reject_reason = ai_result["reject_reason"]
            elif needs_manual_review:
                status = "pending_manual"

        except Exception as e:
            status = "pending_manual"
            needs_manual_review = True
            risk_score = 50
            ai_reasoning = f"AI审核异常，转人工复核: {str(e)}"

    # Create review record
    review = ReviewRecord(
        note_id=note_id,
        author_id=body.author_id,
        note_title=body.title,
        note_content=body.content,
        status=status,
        risk_score=risk_score,
        risk_labels=risk_labels,
        sensitive_words_hit=sensitive_hits,
        ai_risk_score=risk_score,
        ai_risk_labels=risk_labels,
        ai_reasoning=ai_reasoning,
        needs_manual_review=needs_manual_review,
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)

    return success({
        "review_id": review.id,
        "status": status,
        "risk_score": risk_score,
        "risk_labels": risk_labels,
        "review_detail": {
            "sensitive_words_hit": sensitive_hits,
            "ai_risk_score": risk_score,
            "ai_risk_labels": risk_labels,
            "ai_reasoning": ai_reasoning,
            "needs_manual_review": needs_manual_review,
        },
    })


@router.get("/notes/{note_id}/status")
async def get_review_status(
    note_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Get the current review status for a note."""
    result = await session.execute(
        select(ReviewRecord).where(ReviewRecord.note_id == note_id)
        .order_by(ReviewRecord.created_at.desc())
        .limit(1)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise KnowledgeNotFoundError()

    return success(_to_status_out(review))


@router.get("/notes/{note_id}/detail")
async def get_review_detail(
    note_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Get detailed review result for a note."""
    result = await session.execute(
        select(ReviewRecord).where(ReviewRecord.note_id == note_id)
        .order_by(ReviewRecord.created_at.desc())
        .limit(1)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise KnowledgeNotFoundError()

    return success(_to_detail_out(review))


@router.post("/notes/{note_id}/approve")
async def approve_review(
    note_id: str,
    body: ManualReviewRequest,
    session: AsyncSession = Depends(get_db),
):
    """Manually approve a review."""
    result = await session.execute(
        select(ReviewRecord).where(ReviewRecord.note_id == note_id, ReviewRecord.status.in_(["pending_manual", "ai_review"]))
        .order_by(ReviewRecord.created_at.desc())
        .limit(1)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise KnowledgeNotFoundError()

    review.status = "approved"
    review.manual_reviewer = body.reviewer
    review.manual_result = "approved"
    from sqlalchemy import text as sa_text
    review.reviewed_at = sa_text("NOW()")
    await session.commit()
    return success({"status": "approved"})


@router.post("/notes/{note_id}/reject")
async def reject_review(
    note_id: str,
    body: ManualReviewRequest,
    session: AsyncSession = Depends(get_db),
):
    """Manually reject a review."""
    result = await session.execute(
        select(ReviewRecord).where(ReviewRecord.note_id == note_id, ReviewRecord.status.in_(["pending_manual", "ai_review"]))
        .order_by(ReviewRecord.created_at.desc())
        .limit(1)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise KnowledgeNotFoundError()

    review.status = "rejected"
    review.manual_reviewer = body.reviewer
    review.manual_result = "rejected"
    review.manual_reason = body.reason
    from sqlalchemy import text as sa_text
    review.reviewed_at = sa_text("NOW()")
    await session.commit()
    return success({"status": "rejected"})


@router.post("/batch-approve")
async def batch_approve(
    body: BatchReviewRequest,
    session: AsyncSession = Depends(get_db),
):
    """Batch approve reviews."""
    from sqlalchemy import text as sa_text
    for rid in body.review_ids:
        result = await session.execute(
            select(ReviewRecord).where(ReviewRecord.id == rid)
        )
        review = result.scalar_one_or_none()
        if review and review.status in ("pending_manual", "ai_review"):
            review.status = "approved"
            review.manual_reviewer = body.reviewer
            review.manual_result = "approved"
            review.reviewed_at = sa_text("NOW()")

    await session.commit()
    return success({"processed_count": len(body.review_ids)})


@router.post("/batch-reject")
async def batch_reject(
    body: BatchReviewRequest,
    session: AsyncSession = Depends(get_db),
):
    """Batch reject reviews."""
    from sqlalchemy import text as sa_text
    for rid in body.review_ids:
        result = await session.execute(
            select(ReviewRecord).where(ReviewRecord.id == rid)
        )
        review = result.scalar_one_or_none()
        if review and review.status in ("pending_manual", "ai_review"):
            review.status = "rejected"
            review.manual_reviewer = body.reviewer
            review.manual_result = "rejected"
            review.manual_reason = body.reason
            review.reviewed_at = sa_text("NOW()")

    await session.commit()
    return success({"processed_count": len(body.review_ids)})


@router.get("/queue")
async def get_review_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    """Get pending manual review queue."""
    query = select(ReviewRecord).where(
        ReviewRecord.status.in_(["pending_manual", "ai_review", "screening"])
    ).order_by(ReviewRecord.created_at.asc())

    count_query = select(func.count(ReviewRecord.id)).where(
        ReviewRecord.status.in_(["pending_manual", "ai_review", "screening"])
    )

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    result = await session.execute(
        query.offset((page - 1) * page_size).limit(page_size)
    )
    reviews = result.scalars().all()

    return paginated([_to_record_out(r) for r in reviews], total, page, page_size)


@router.get("/records")
async def get_review_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    """Get historical review records."""
    query = select(ReviewRecord).order_by(ReviewRecord.created_at.desc())
    count_query = select(func.count(ReviewRecord.id))

    if status and status != "all":
        query = query.where(ReviewRecord.status == status)
        count_query = count_query.where(ReviewRecord.status == status)

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    result = await session.execute(
        query.offset((page - 1) * page_size).limit(page_size)
    )
    reviews = result.scalars().all()

    return paginated([_to_record_out(r) for r in reviews], total, page, page_size)


@router.get("/statistics")
async def get_review_statistics(
    session: AsyncSession = Depends(get_db),
):
    """Get review statistics."""
    from datetime import datetime, timezone
    from sqlalchemy import cast, Date

    today = datetime.now(timezone.utc).date()

    # Today's stats
    today_result = await session.execute(
        select(
            func.count().filter(ReviewRecord.status.in_(["pending_manual", "ai_review", "screening"])).label("pending"),
            func.count().filter(ReviewRecord.status.in_(["approved", "rejected"])).label("reviewed"),
        ).where(cast(ReviewRecord.created_at, Date) == today)
    )
    today_row = today_result.one_or_none()
    today_pending = today_row.pending if today_row else 0
    today_reviewed = today_row.reviewed if today_row else 0

    # Weekly stats
    from datetime import timedelta
    week_start = today - timedelta(days=7)
    weekly_result = await session.execute(
        select(
            func.count().filter(ReviewRecord.status == "approved").label("approved"),
            func.count().filter(ReviewRecord.status.in_(["approved", "rejected"])).label("total"),
        ).where(cast(ReviewRecord.created_at, Date) >= week_start)
    )
    weekly_row = weekly_result.one_or_none()
    weekly_approved = weekly_row.approved if weekly_row else 0
    weekly_total = weekly_row.total if weekly_row else 0
    weekly_approval_rate = round(weekly_approved / weekly_total * 100, 1) if weekly_total > 0 else 0.0

    return success({
        "today_pending": today_pending,
        "today_reviewed": today_reviewed,
        "weekly_approval_rate": weekly_approval_rate,
        "ai_accuracy": 0.0,
        "by_date": [],
    })
