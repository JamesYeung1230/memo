"""
C6 User Management Admin API Router.

Endpoints (prefix="/api/v1"):

  GET  /admin/users          - Paginated user list with optional keyword search
  GET  /admin/users/{user_id} - User detail with stats, learning records, and point records
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from services.core.models import (
    AnswerRecord, LearningRecord, Note, PointsRecord, User,
)
from services.core.routes.deps import get_admin_id, get_db
from shared.errors import NotFoundError
from shared.responses import paginated, success

router = APIRouter(prefix="/api/v1")


# ═════════════════════════════════════════════
#  Serialization helpers
# ═════════════════════════════════════════════


def _serialize_user(u: User, points_balance: int = 0, last_active_time: str | None = None) -> dict:
    return {
        "id": str(u.id),
        "nickname": u.nickname,
        "avatar_url": u.avatar_url,
        "openid": u.openid,
        "points_balance": points_balance,
        "created_at": str(u.created_at) if u.created_at else None,
        "last_active_time": last_active_time,
    }


def _serialize_user_detail(u: User) -> dict:
    return {
        "id": str(u.id),
        "openid": u.openid,
        "nickname": u.nickname,
        "avatar_url": u.avatar_url,
        "violation_count": u.violation_count,
        "review_ban_until": str(u.review_ban_until) if u.review_ban_until else None,
        "share_ban_until": str(u.share_ban_until) if u.share_ban_until else None,
        "last_login_at": str(u.last_login_at) if u.last_login_at else None,
        "created_at": str(u.created_at) if u.created_at else None,
        "updated_at": str(u.updated_at) if u.updated_at else None,
    }


def _serialize_learning_record(lr: LearningRecord) -> dict:
    return {
        "id": lr.id,
        "user_id": lr.user_id,
        "card_id": lr.card_id,
        "domain_id": lr.domain_id,
        "chapter_id": lr.chapter_id,
        "status": lr.status,
        "learned_at": str(lr.learned_at) if lr.learned_at else None,
        "review_count": lr.review_count,
        "next_review_at": str(lr.next_review_at) if lr.next_review_at else None,
        "created_at": str(lr.created_at) if lr.created_at else None,
    }


def _serialize_point_record(pr: PointsRecord) -> dict:
    return {
        "id": pr.id,
        "user_id": pr.user_id,
        "points": pr.points,
        "balance_after": pr.balance_after,
        "action_type": pr.action_type,
        "reference_id": pr.reference_id,
        "description": pr.description,
        "created_at": str(pr.created_at) if pr.created_at else None,
    }


# ═════════════════════════════════════════════
#  Helpers
# ═════════════════════════════════════════════


async def _get_points_balance(db: AsyncSession, user_id: str) -> int:
    """Get total points balance for a user."""
    result = await db.execute(
        select(func.coalesce(func.sum(PointsRecord.points), 0)).where(
            PointsRecord.user_id == user_id
        )
    )
    return result.scalar() or 0


async def _get_last_active_time(db: AsyncSession, user_id: str) -> str | None:
    """Get the most recent activity timestamp from LearningRecord or PointsRecord."""
    lr_result = await db.execute(
        select(func.max(LearningRecord.created_at)).where(
            LearningRecord.user_id == user_id
        )
    )
    lr_max = lr_result.scalar()

    pr_result = await db.execute(
        select(func.max(PointsRecord.created_at)).where(
            PointsRecord.user_id == user_id
        )
    )
    pr_max = pr_result.scalar()

    if lr_max and pr_max:
        latest = max(lr_max, pr_max)
        return str(latest)
    elif lr_max:
        return str(lr_max)
    elif pr_max:
        return str(pr_max)
    return None


# ═════════════════════════════════════════════
#  GET /admin/users — 用户列表
# ═════════════════════════════════════════════


@router.get("/admin/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = Query(None, description="搜索昵称或 openid"),
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """Paginated user list with optional keyword search on nickname and openid."""
    conditions: list = []
    if keyword:
        like_pattern = f"%{keyword}%"
        conditions.append(
            or_(
                User.nickname.ilike(like_pattern),
                User.openid.ilike(like_pattern),
            )
        )

    # Total count
    count_query = select(func.count()).select_from(User)
    if conditions:
        count_query = count_query.where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginated query
    query = select(User)
    if conditions:
        query = query.where(and_(*conditions))
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    # Enrich each user with points_balance and last_active_time
    user_items: list[dict] = []
    for u in users:
        user_id_str = str(u.id)
        points_balance = await _get_points_balance(db, user_id_str)
        last_active_time = await _get_last_active_time(db, user_id_str)
        user_items.append(_serialize_user(u, points_balance, last_active_time))

    return paginated(
        data=user_items,
        total=total,
        page=page,
        page_size=page_size,
    )


# ═════════════════════════════════════════════
#  GET /admin/users/{user_id} — 用户详情
# ═════════════════════════════════════════════


@router.get("/admin/users/{user_id}")
async def get_user_detail(
    user_id: str,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """Get user detail with stats, recent learning records, and recent point records."""
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError(f"User {user_id} not found")

    user_id_str = str(user.id)

    # Stats: card_count (learning records), answer_count, points_balance, note_count
    card_count_result = await db.execute(
        select(func.count()).where(LearningRecord.user_id == user_id_str)
    )
    card_count = card_count_result.scalar() or 0

    answer_count_result = await db.execute(
        select(func.count()).where(AnswerRecord.user_id == user_id_str)
    )
    answer_count = answer_count_result.scalar() or 0

    points_balance = await _get_points_balance(db, user_id_str)

    note_count_result = await db.execute(
        select(func.count()).where(Note.user_id == user_id_str)
    )
    note_count = note_count_result.scalar() or 0

    # Recent learning records (last 10)
    lr_result = await db.execute(
        select(LearningRecord)
        .where(LearningRecord.user_id == user_id_str)
        .order_by(LearningRecord.created_at.desc())
        .limit(10)
    )
    learning_records = [_serialize_learning_record(lr) for lr in lr_result.scalars().all()]

    # Recent point records (last 10)
    pr_result = await db.execute(
        select(PointsRecord)
        .where(PointsRecord.user_id == user_id_str)
        .order_by(PointsRecord.created_at.desc())
        .limit(10)
    )
    point_records = [_serialize_point_record(pr) for pr in pr_result.scalars().all()]

    return success({
        "user": _serialize_user_detail(user),
        "stats": {
            "card_count": card_count,
            "answer_count": answer_count,
            "points_balance": points_balance,
            "note_count": note_count,
        },
        "learning_records": learning_records,
        "point_records": point_records,
    })
