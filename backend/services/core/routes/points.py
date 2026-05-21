"""
C5 Points System API Router.

Endpoints (prefix="/api/v1"):

User endpoints (public):
  GET    /points/balance          - 查询积分余额
  GET    /points/records          - 积分明细列表（分页）
  GET    /points/rules            - 获取当前积分规则
  POST   /points/ad-watch         - 观看激励广告（+10分，每日上限100分）
  POST   /points/unlock           - 消耗积分解锁领域

Admin endpoints:
  GET    /admin/points-rules          - 获取积分规则配置
  PUT    /admin/points-rules          - 更新积分规则配置
  GET    /admin/points-rules/history  - 配置变更历史
"""

from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from services.core.models import PointsRecord, Config
from services.core.routes.deps import get_db, get_user_id, get_admin_id, get_redis
from shared.errors import AppException, ErrorCode
from shared.responses import success, paginated

router = APIRouter(prefix="/api/v1")

# ─────────────────────────────────────────────
#  Constants
# ─────────────────────────────────────────────

DAILY_AD_LIMIT = 100
AD_WATCH_POINTS = 10

# ─────────────────────────────────────────────
#  Schemas
# ─────────────────────────────────────────────


class PointsRulesUpdate(BaseModel):
    """积分规则配置更新."""
    points_rules: dict


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────


async def _get_balance(db: AsyncSession, user_id: str) -> int:
    result = await db.execute(
        select(func.coalesce(func.sum(PointsRecord.points), 0))
        .where(PointsRecord.user_id == user_id)
    )
    return result.scalar() or 0


async def _get_config_entry(db: AsyncSession, config_key: str) -> Config | None:
    result = await db.execute(
        select(Config).where(Config.config_key == config_key)
    )
    return result.scalar_one_or_none()


def _serialize_config(c: Config | None) -> dict:
    if c is None:
        return {}
    return {
        "config_key": c.config_key,
        "config_value": c.config_value,
        "version": c.version,
        "description": c.description,
        "updated_by": c.updated_by,
        "updated_at": str(c.updated_at) if c.updated_at else None,
    }


# ═════════════════════════════════════════════
#  User endpoints  (/api/v1/points/*)
# ═════════════════════════════════════════════


@router.get("/points/balance")
async def get_points_balance(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """查询当前用户积分余额."""
    balance = await _get_balance(db, user_id)
    return success({"balance": balance})


@router.get("/points/records")
async def get_points_records(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    action_type: str | None = Query(None, description="筛选 action_type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """获取当前用户积分明细列表（分页，支持 action_type 筛选）. """
    conditions = [PointsRecord.user_id == user_id]
    if action_type:
        conditions.append(PointsRecord.action_type == action_type)

    count_result = await db.execute(
        select(func.count(PointsRecord.id)).where(and_(*conditions))
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(PointsRecord)
        .where(and_(*conditions))
        .order_by(PointsRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    records = result.scalars().all()

    return paginated(
        data=[
            {
                "id": r.id,
                "points": r.points,
                "balance_after": r.balance_after,
                "action_type": r.action_type,
                "reference_id": r.reference_id,
                "description": r.description,
                "created_at": str(r.created_at) if r.created_at else None,
            }
            for r in records
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/points/rules")
async def get_points_rules(
    db: AsyncSession = Depends(get_db),
):
    """获取当前积分规则（从 config 表读取 config_key='points_rules'）. """
    config = await _get_config_entry(db, "points_rules")
    return success(config.config_value if config else {})


@router.post("/points/ad-watch")
async def ad_watch(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """
    观看激励广告获得积分:
      - 每次 +10 分
      - 每日上限 100 分（Redis 计数器）
    """
    today = date.today().isoformat()
    daily_key = f"points:ad_watch_daily:{user_id}:{today}"

    raw = await redis.get(daily_key)
    daily_total = int(raw) if raw else 0

    if daily_total >= DAILY_AD_LIMIT:
        raise AppException(
            ErrorCode("DAILY_LIMIT_REACHED", 400, "今日广告积分已达上限"),
        )

    balance = await _get_balance(db, user_id)
    new_balance = balance + AD_WATCH_POINTS

    record = PointsRecord(
        user_id=user_id,
        points=AD_WATCH_POINTS,
        balance_after=new_balance,
        action_type="ad_watch",
        description="观看激励广告获得积分",
    )
    db.add(record)
    await db.commit()

    # Update Redis daily counter
    await redis.incr(daily_key)
    await redis.expire(daily_key, 86400)

    return success({
        "points_added": AD_WATCH_POINTS,
        "balance_after": new_balance,
        "daily_total": daily_total + 1,
        "daily_limit": DAILY_AD_LIMIT,
    })


class UnlockRequest(BaseModel):
    domain_id: str
    points_cost: int


@router.post("/points/unlock")
async def unlock_domain(
    body: UnlockRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """消耗积分解锁知识领域."""
    balance = await _get_balance(db, user_id)
    if balance < body.points_cost:
        raise AppException(
            ErrorCode("INSUFFICIENT_POINTS", 400, "积分不足"),
        )

    new_balance = balance - body.points_cost
    record = PointsRecord(
        user_id=user_id,
        points=-body.points_cost,
        balance_after=new_balance,
        action_type="unlock_domain",
        reference_id=body.domain_id,
        description=f"解锁知识领域 {body.domain_id}",
    )
    db.add(record)
    await db.commit()

    return success({
        "domain_id": body.domain_id,
        "points_cost": body.points_cost,
        "balance_after": new_balance,
    })


# ═════════════════════════════════════════════
#  Admin endpoints  (/api/v1/admin/*)
# ═════════════════════════════════════════════


@router.get("/admin/points-rules")
async def admin_get_points_rules(
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """获取积分规则配置（points_rules + checkin_milestones）. """
    points_rules = await _get_config_entry(db, "points_rules")
    checkin_milestones = await _get_config_entry(db, "checkin_milestones")

    return success({
        "points_rules": _serialize_config(points_rules),
        "checkin_milestones": _serialize_config(checkin_milestones),
    })


@router.put("/admin/points-rules")
async def admin_update_points_rules(
    body: PointsRulesUpdate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """更新积分规则配置（version +1）. """
    config = await _get_config_entry(db, "points_rules")

    if config:
        config.config_value = body.points_rules
        config.version += 1
        config.updated_by = admin_id
    else:
        config = Config(
            config_key="points_rules",
            config_value=body.points_rules,
            version=1,
            updated_by=admin_id,
        )
        db.add(config)

    await db.commit()
    await db.refresh(config)

    return success({
        "config_key": config.config_key,
        "config_value": config.config_value,
        "version": config.version,
        "updated_by": config.updated_by,
    })


@router.get("/admin/points-rules/history")
async def admin_get_points_rules_history(
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """
    配置变更历史.

    TODO: 当前 Config 表只有最新版本（config_key 唯一）。
          后续可创建 ConfigHistory 表或给 Config 添加 archived 字段
          来记录每一次版本变更。
    """
    config = await _get_config_entry(db, "points_rules")

    return success({
        "current_version": config.version if config else None,
        "config_value": config.config_value if config else {},
        "updated_by": config.updated_by if config else None,
        "updated_at": str(config.updated_at) if config and config.updated_at else None,
        "history_entries": [],
    })
