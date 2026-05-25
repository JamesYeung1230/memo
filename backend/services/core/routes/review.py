from datetime import date, datetime, timedelta, time

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from services.core.clients import KnowledgeClient
from services.core.models import LearningRecord, ReviewConfig
from services.core.routes.deps import get_db, get_knowledge_client, get_user_id
from shared.responses import success

router = APIRouter(prefix="/api/v1/review", tags=["Review - Memory Reinforcement"])


PRESETS = {
    "standard": {"name": "Standard Ebbinghaus", "nodes": [1, 2, 4, 7, 15]},
    "relaxed": {"name": "Relaxed", "nodes": [3, 7, 15]},
    "intensive": {"name": "Intensive", "nodes": [1, 2, 3, 5, 7, 15, 30]},
}


class ReviewConfigUpdate(BaseModel):
    review_nodes: list[int] | None = None
    daily_limit: int | None = Field(None, ge=5, le=50)
    forgotten_alert_days: int | None = Field(None, ge=3, le=30)
    reminder_time: str | None = None
    weekend_quiet: bool | None = None


async def _get_or_create_config(user_id: str, db: AsyncSession) -> ReviewConfig:
    result = await db.execute(
        select(ReviewConfig).where(ReviewConfig.user_id == user_id)
    )
    config = result.scalar_one_or_none()
    if not config:
        config = ReviewConfig(user_id=user_id)
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


@router.get("/today")
async def get_today_review(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    config = await _get_or_create_config(user_id, db)

    result = await db.execute(
        select(LearningRecord).where(
            LearningRecord.user_id == user_id,
            LearningRecord.next_review_at <= datetime.now(),
        )
        .order_by(LearningRecord.next_review_at.asc())
        .offset((page - 1) * page_size).limit(config.daily_limit)
    )
    records = result.scalars().all()

    cards = []
    for r in records:
        try:
            card = await client.get_card_detail(r.card_id)
            card["review_count"] = r.review_count
            card["next_review_at"] = str(r.next_review_at) if r.next_review_at else None
            cards.append(card)
        except Exception:
            pass

    return success({
        "total": len(records),
        "daily_limit": config.daily_limit,
        "cards": cards,
    })


@router.post("/cards/{card_id}/complete")
async def complete_review(
    card_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LearningRecord).where(
            LearningRecord.user_id == user_id,
            LearningRecord.card_id == card_id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Learning record not found")

    config = await _get_or_create_config(user_id, db)
    nodes = sorted(config.review_nodes or [1, 2, 4, 7, 15])
    next_idx = min(record.review_count, len(nodes) - 1)
    next_days = nodes[next_idx]

    record.review_count += 1
    record.next_review_at = datetime.now() + timedelta(days=next_days)
    await db.commit()

    return success({
        "card_id": card_id,
        "review_count": record.review_count,
        "next_review_at": record.next_review_at,
    })


@router.get("/forgotten")
async def get_forgotten(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
):
    config = await _get_or_create_config(user_id, db)
    alert_days = config.forgotten_alert_days
    cutoff = datetime.now() - timedelta(days=alert_days)

    result = await db.execute(
        select(LearningRecord).where(
            LearningRecord.user_id == user_id,
            LearningRecord.learned_at.isnot(None),
            LearningRecord.next_review_at <= cutoff,
        )
        .order_by(LearningRecord.next_review_at.asc())
        .limit(50)
    )
    records = result.scalars().all()

    return success([{
        "card_id": r.card_id,
        "last_reviewed_at": str(r.learned_at) if r.learned_at else None,
        "next_review_at": str(r.next_review_at) if r.next_review_at else None,
        "days_overdue": (datetime.now() - r.next_review_at).days if r.next_review_at else 0,
    } for r in records if r.next_review_at])


@router.get("/notes")
async def get_note_review_prompts(
    user_id: str = Depends(get_user_id),
    client: KnowledgeClient = Depends(get_knowledge_client),
):
    records = await client.get_review_records(page=1, page_size=20)
    return success(records or [])


@router.get("/config")
async def get_review_config(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    config = await _get_or_create_config(user_id, db)
    return success({
        "review_nodes": config.review_nodes,
        "daily_limit": config.daily_limit,
        "forgotten_alert_days": config.forgotten_alert_days,
        "reminder_time": str(config.reminder_time) if config.reminder_time else "20:00",
        "weekend_quiet": config.weekend_quiet,
        "preset": config.preset,
    })


@router.put("/config")
async def update_review_config(
    body: ReviewConfigUpdate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    config = await _get_or_create_config(user_id, db)
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)
    await db.commit()
    return success({"updated": list(update_data.keys())})


@router.post("/config/reset")
async def reset_review_config(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    config = await _get_or_create_config(user_id, db)
    config.review_nodes = [1, 2, 4, 7, 15]
    config.daily_limit = 20
    config.forgotten_alert_days = 7
    config.reminder_time = time(20, 0)
    config.weekend_quiet = False
    config.preset = None
    await db.commit()
    return success({"message": "Config reset to defaults"})
