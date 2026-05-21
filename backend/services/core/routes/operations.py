"""
C6 Operations Configuration API Router.

Endpoints (prefix="/api/v1"):

Banner:
  GET    /admin/banners              - Banner 列表（排序 order）
  POST   /admin/banners              - 新增 Banner
  PUT    /admin/banners/{id}         - 编辑 Banner
  DELETE /admin/banners/{id}         - 删除 Banner
  POST   /admin/banners/{id}/toggle  - 上架/下架
  PUT    /admin/banners/reorder      - 拖拽排序
  POST   /admin/banners/{id}/upload  - 上传图片（v1.0 占位）

Config:
  GET    /admin/unlock-config        - 获取解锁消耗配置
  PUT    /admin/unlock-config        - 更新解锁消耗配置
  GET    /admin/theme-config         - 获取主题色配置
  PUT    /admin/theme-config         - 更新主题色配置
  GET    /admin/ad-config            - 获取广告配置
  PUT    /admin/ad-config            - 更新广告配置
  GET    /admin/homepage-config      - 获取首页模块配置
  PUT    /admin/homepage-config      - 更新首页模块配置

Badge (Achievement):
  GET    /admin/badges               - 成就徽章列表
  POST   /admin/badges               - 新增徽章
  PUT    /admin/badges/{id}          - 编辑徽章
  POST   /admin/badges/{id}/toggle   - 上架/下架
"""

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from services.core.models import Config, Banner, Achievement
from services.core.routes.deps import get_db, get_admin_id
from shared.errors import AppException, ErrorCode, NotFoundError
from shared.responses import success

router = APIRouter(prefix="/api/v1")

# ═════════════════════════════════════════════
#  Schemas
# ═════════════════════════════════════════════


class BannerCreate(BaseModel):
    title: str
    image_url: str
    link_type: str | None = None
    link_param: str | None = None
    sort_order: int = 0
    start_date: str | None = None
    end_date: str | None = None


class BannerUpdate(BaseModel):
    title: str | None = None
    image_url: str | None = None
    link_type: str | None = None
    link_param: str | None = None
    sort_order: int | None = None
    start_date: str | None = None
    end_date: str | None = None


class BannerReorderItem(BaseModel):
    id: str
    sort_order: int


class BannerReorder(BaseModel):
    items: list[BannerReorderItem]


class BadgeCreate(BaseModel):
    name: str
    description: str
    icon_url: str
    points_required: int | None = None


class BadgeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon_url: str | None = None
    points_required: int | None = None


class ConfigUpdate(BaseModel):
    config_value: dict[str, Any]
    description: str | None = None


# ═════════════════════════════════════════════
#  Helpers
# ═════════════════════════════════════════════


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


def _serialize_banner(b: Banner) -> dict:
    return {
        "id": b.id,
        "title": b.title,
        "image_url": b.image_url,
        "link_type": b.link_type,
        "link_param": b.link_param,
        "sort_order": b.sort_order,
        "status": b.status,
        "start_date": str(b.start_date) if b.start_date else None,
        "end_date": str(b.end_date) if b.end_date else None,
        "click_count": b.click_count,
        "impression_pv": b.impression_pv,
        "impression_uv": b.impression_uv,
        "created_at": str(b.created_at) if b.created_at else None,
        "updated_at": str(b.updated_at) if b.updated_at else None,
    }


def _serialize_badge(b: Achievement) -> dict:
    return {
        "id": b.id,
        "name": b.name,
        "description": b.description,
        "icon_url": b.icon_url,
        "points_required": b.points_required,
        "status": b.status,
        "created_at": str(b.created_at) if b.created_at else None,
        "updated_at": str(b.updated_at) if b.updated_at else None,
    }


async def _update_or_create_config(
    db: AsyncSession,
    config_key: str,
    config_value: dict[str, Any],
    admin_id: str,
    description: str | None = None,
) -> Config:
    """通用 Config 更新/创建逻辑：存在则合并更新，不存在则新建."""
    config = await _get_config_entry(db, config_key)

    if config:
        config.config_value = config_value
        config.version += 1
        config.updated_by = admin_id
        if description is not None:
            config.description = description
    else:
        config = Config(
            config_key=config_key,
            config_value=config_value,
            version=1,
            updated_by=admin_id,
            description=description,
        )
        db.add(config)

    await db.commit()
    await db.refresh(config)
    return config


# ═════════════════════════════════════════════
#  Banner  (/api/v1/admin/banners/*)
# ═════════════════════════════════════════════


@router.get("/admin/banners")
async def list_banners(
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """Banner 列表，按 sort_order 升序排列."""
    result = await db.execute(
        select(Banner).order_by(Banner.sort_order.asc(), Banner.created_at.desc())
    )
    banners = result.scalars().all()
    return success([_serialize_banner(b) for b in banners])


@router.post("/admin/banners")
async def create_banner(
    body: BannerCreate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """新增 Banner."""
    banner = Banner(
        title=body.title,
        image_url=body.image_url,
        link_type=body.link_type,
        link_param=body.link_param,
        sort_order=body.sort_order,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return success(_serialize_banner(banner))


@router.put("/admin/banners/{banner_id}")
async def update_banner(
    banner_id: str,
    body: BannerUpdate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """编辑 Banner."""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise NotFoundError(f"Banner {banner_id} not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(banner, field, value)

    await db.commit()
    await db.refresh(banner)
    return success(_serialize_banner(banner))


@router.delete("/admin/banners/{banner_id}")
async def delete_banner(
    banner_id: str,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """删除 Banner."""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise NotFoundError(f"Banner {banner_id} not found")

    await db.delete(banner)
    await db.commit()
    return success({"deleted": True})


@router.post("/admin/banners/{banner_id}/toggle")
async def toggle_banner(
    banner_id: str,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """上架 / 下架 Banner."""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise NotFoundError(f"Banner {banner_id} not found")

    banner.status = "disabled" if banner.status == "enabled" else "enabled"
    await db.commit()
    await db.refresh(banner)
    return success(_serialize_banner(banner))


@router.put("/admin/banners/reorder")
async def reorder_banners(
    body: BannerReorder,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """拖拽排序：批量更新 Banner 的 sort_order."""
    order_map = {item.id: item.sort_order for item in body.items}

    result = await db.execute(
        select(Banner).where(Banner.id.in_(order_map.keys()))
    )
    banners = result.scalars().all()

    found_ids = {b.id for b in banners}
    missing_ids = set(order_map.keys()) - found_ids
    if missing_ids:
        raise NotFoundError(f"Banners not found: {', '.join(missing_ids)}")

    for banner in banners:
        banner.sort_order = order_map[banner.id]

    await db.commit()

    # Return all banners in new order
    all_banners = await db.execute(
        select(Banner).order_by(Banner.sort_order.asc(), Banner.created_at.desc())
    )
    return success([_serialize_banner(b) for b in all_banners.scalars().all()])


@router.post("/admin/banners/{banner_id}/upload")
async def upload_banner_image(
    banner_id: str,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """
    上传 Banner 图片（v1.0 占位实现）.

    TODO: v2.0 实现真实文件上传，保存至 /data/uploads/banners/ 目录.
    """
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise NotFoundError(f"Banner {banner_id} not found")

    return success({"success": True})


# ═════════════════════════════════════════════
#  Unlock Config  (/api/v1/admin/unlock-config)
# ═════════════════════════════════════════════


@router.get("/admin/unlock-config")
async def get_unlock_config(
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """获取解锁消耗配置（config_key='unlock_config'）. """
    config = await _get_config_entry(db, "unlock_config")
    return success(_serialize_config(config))


@router.put("/admin/unlock-config")
async def update_unlock_config(
    body: ConfigUpdate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """更新解锁消耗配置."""
    config = await _update_or_create_config(
        db, "unlock_config", body.config_value, admin_id, body.description,
    )
    return success(_serialize_config(config))


# ═════════════════════════════════════════════
#  Theme Config  (/api/v1/admin/theme-config)
# ═════════════════════════════════════════════


@router.get("/admin/theme-config")
async def get_theme_config(
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """获取主题色配置（config_key='theme_config'）. """
    config = await _get_config_entry(db, "theme_config")
    return success(_serialize_config(config))


@router.put("/admin/theme-config")
async def update_theme_config(
    body: ConfigUpdate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """更新主题色配置."""
    config = await _update_or_create_config(
        db, "theme_config", body.config_value, admin_id, body.description,
    )
    return success(_serialize_config(config))


# ═════════════════════════════════════════════
#  Ad Config  (/api/v1/admin/ad-config)
# ═════════════════════════════════════════════


@router.get("/admin/ad-config")
async def get_ad_config(
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """获取广告配置（config_key='ad_config'）. """
    config = await _get_config_entry(db, "ad_config")
    return success(_serialize_config(config))


@router.put("/admin/ad-config")
async def update_ad_config(
    body: ConfigUpdate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """更新广告配置."""
    config = await _update_or_create_config(
        db, "ad_config", body.config_value, admin_id, body.description,
    )
    return success(_serialize_config(config))


# ═════════════════════════════════════════════
#  Badge (Achievement)  (/api/v1/admin/badges/*)
# ═════════════════════════════════════════════


@router.get("/admin/badges")
async def list_badges(
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """成就徽章列表."""
    result = await db.execute(
        select(Achievement).order_by(Achievement.created_at.desc())
    )
    badges = result.scalars().all()
    return success([_serialize_badge(b) for b in badges])


@router.post("/admin/badges")
async def create_badge(
    body: BadgeCreate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """新增成就徽章."""
    badge = Achievement(
        name=body.name,
        description=body.description,
        icon_url=body.icon_url,
        points_required=body.points_required,
    )
    db.add(badge)
    await db.commit()
    await db.refresh(badge)
    return success(_serialize_badge(badge))


@router.put("/admin/badges/{badge_id}")
async def update_badge(
    badge_id: str,
    body: BadgeUpdate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """编辑成就徽章."""
    result = await db.execute(select(Achievement).where(Achievement.id == badge_id))
    badge = result.scalar_one_or_none()
    if not badge:
        raise NotFoundError(f"Badge {badge_id} not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(badge, field, value)

    await db.commit()
    await db.refresh(badge)
    return success(_serialize_badge(badge))


@router.post("/admin/badges/{badge_id}/toggle")
async def toggle_badge(
    badge_id: str,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """上架 / 下架成就徽章（published <-> draft）. """
    result = await db.execute(select(Achievement).where(Achievement.id == badge_id))
    badge = result.scalar_one_or_none()
    if not badge:
        raise NotFoundError(f"Badge {badge_id} not found")

    badge.status = "draft" if badge.status == "published" else "published"
    await db.commit()
    await db.refresh(badge)
    return success(_serialize_badge(badge))


# ═════════════════════════════════════════════
#  Homepage Config  (/api/v1/admin/homepage-config)
# ═════════════════════════════════════════════


@router.get("/admin/homepage-config")
async def get_homepage_config(
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """获取首页模块配置（config_key='homepage_module_order'）. """
    config = await _get_config_entry(db, "homepage_module_order")
    return success(_serialize_config(config))


@router.put("/admin/homepage-config")
async def update_homepage_config(
    body: ConfigUpdate,
    admin_id: str = Depends(get_admin_id),
    db: AsyncSession = Depends(get_db),
):
    """更新首页模块配置."""
    config = await _update_or_create_config(
        db, "homepage_module_order", body.config_value, admin_id, body.description,
    )
    return success(_serialize_config(config))
