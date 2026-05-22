from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from services.core.clients import KnowledgeClient
from services.core.models import LearningRecord, FavoriteCard, PointsRecord
from services.core.routes.deps import get_db, get_knowledge_client, get_user_id
from shared.responses import success

router = APIRouter(prefix="/api/v1/learn", tags=["Learning - Records"])


@router.get("/domains")
async def get_learn_domains(
    client: KnowledgeClient = Depends(get_knowledge_client),
    user_id: str = Depends(get_user_id),
):
    domains = await client.get_domains(status="published")
    return success(domains or [])


@router.get("/domains/{domain_id}/chapters")
async def get_learn_chapters(
    domain_id: str,
    client: KnowledgeClient = Depends(get_knowledge_client),
    user_id: str = Depends(get_user_id),
):
    chapters = await client.get_chapters(domain_id, status="published")
    return success(chapters or [])


async def _enrich_cards_with_status(cards: list[dict], user_id: str, db: AsyncSession):
    """Add mastered/favorited/learn_status to a list of cards."""
    if not cards:
        return cards

    card_ids = [c["id"] for c in cards]

    # 学习记录 → mastered
    records = await db.execute(
        select(LearningRecord.card_id, LearningRecord.status).where(
            LearningRecord.card_id.in_(card_ids),
            LearningRecord.user_id == user_id,
        )
    )
    status_map = {r.card_id: r.status for r in records.fetchall()}

    # 收藏
    favs = await db.execute(
        select(FavoriteCard.card_id).where(
            FavoriteCard.card_id.in_(card_ids),
            FavoriteCard.user_id == user_id,
        )
    )
    fav_set = {r[0] for r in favs.fetchall()}

    for card in cards:
        cid = card["id"]
        s = status_map.get(cid, "not_learned")
        card["learn_status"] = s
        card["mastered"] = s == "mastered"
        card["favorited"] = cid in fav_set

    return cards


@router.get("/chapters/{chapter_id}/cards")
async def get_learn_cards(
    chapter_id: str,
    client: KnowledgeClient = Depends(get_knowledge_client),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    cards = await client.get_cards(chapter_id, status="published")
    cards = await _enrich_cards_with_status(cards or [], user_id, db)
    return success(cards)


@router.get("/cards/{card_id}")
async def get_learn_card_detail(
    card_id: str,
    client: KnowledgeClient = Depends(get_knowledge_client),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    card = await client.get_card_detail(card_id)
    if card:
        cards = await _enrich_cards_with_status([card], user_id, db)
        card = cards[0]
    return success(card)


@router.post("/cards/{card_id}/master")
async def mark_card_mastered(
    card_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
):
    # Get card detail → chapter_id, then chapter detail → domain_id
    card_detail = await client.get_card_detail(card_id)
    chapter_id = card_detail.get("chapter_id", "")
    domain_id = ""
    if chapter_id:
        try:
            chapter_detail = await client.get_chapter_detail(chapter_id)
            domain_id = chapter_detail.get("domain_id", "")
        except Exception:
            pass

    result = await db.execute(
        select(LearningRecord).where(
            LearningRecord.user_id == user_id,
            LearningRecord.card_id == card_id,
        )
    )
    record = result.scalar_one_or_none()

    if record:
        record.status = "mastered"
    else:
        record = LearningRecord(
            user_id=user_id,
            card_id=card_id,
            domain_id=domain_id or None,
            chapter_id=chapter_id or None,
            status="mastered",
        )
        db.add(record)

    await db.flush()

    # Award points for mastering a card
    result_balance = await db.execute(
        select(func.coalesce(func.sum(PointsRecord.points), 0)).where(PointsRecord.user_id == user_id)
    )
    current_balance = result_balance.scalar() or 0
    points_record = PointsRecord(
        user_id=user_id,
        points=1,
        balance_after=current_balance + 1,
        action_type="learn_card",
        reference_id=card_id,
        description="掌握知识卡片",
    )
    db.add(points_record)

    await db.commit()
    return success({"status": "mastered", "points_earned": 1, "balance_after": current_balance + 1})


@router.get("/cards/{card_id}/status")
async def get_card_status(
    card_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Check if a card is mastered / favorited by the current user."""
    record = await db.execute(
        select(LearningRecord).where(
            LearningRecord.user_id == user_id,
            LearningRecord.card_id == card_id,
            LearningRecord.status == "mastered",
        )
    )
    mastered = record.scalar_one_or_none() is not None

    fav = await db.execute(
        select(FavoriteCard).where(
            FavoriteCard.user_id == user_id,
            FavoriteCard.card_id == card_id,
        )
    )
    favorited = fav.scalar_one_or_none() is not None

    return success({
        "mastered": mastered,
        "favorited": favorited,
    })


@router.get("/cards/{card_id}/question")
async def get_card_question(
    card_id: str,
    client: KnowledgeClient = Depends(get_knowledge_client),
    user_id: str = Depends(get_user_id),
):
    question = await client.get_question(card_id)
    return success(question)


@router.get("/progress")
async def get_learning_progress(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    total = await db.execute(
        select(func.count(LearningRecord.id)).where(LearningRecord.user_id == user_id)
    )
    mastered = await db.execute(
        select(func.count(LearningRecord.id)).where(
            LearningRecord.user_id == user_id,
            LearningRecord.status == "mastered",
        )
    )
    today = await db.execute(
        select(func.count(LearningRecord.id)).where(
            LearningRecord.user_id == user_id,
            func.DATE(LearningRecord.learned_at) == date.today(),
        )
    )

    return success({
        "total_learned": total.scalar() or 0,
        "mastered": mastered.scalar() or 0,
        "today_learned": today.scalar() or 0,
    })


@router.post("/cards/{card_id}/favorite")
async def toggle_favorite(
    card_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FavoriteCard).where(
            FavoriteCard.user_id == user_id,
            FavoriteCard.card_id == card_id,
        )
    )
    fav = result.scalar_one_or_none()
    if fav:
        await db.delete(fav)
        await db.commit()
        return success({"favorited": False})
    else:
        fav = FavoriteCard(user_id=user_id, card_id=card_id)
        db.add(fav)
        await db.commit()
        return success({"favorited": True})


@router.get("/favorites")
async def get_favorites(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    result = await db.execute(
        select(FavoriteCard).where(FavoriteCard.user_id == user_id)
        .order_by(FavoriteCard.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    favorites = result.scalars().all()
    return success([{"id": f.id, "card_id": f.card_id, "created_at": str(f.created_at) if f.created_at else None} for f in favorites])
