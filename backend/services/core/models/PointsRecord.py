from sqlalchemy import Integer, String, text
from sqlalchemy.dialects.postgresql import ENUM, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.core.models.base import Base


class PointsRecord(Base):
    __tablename__ = "points_record"
    __table_args__ = {"schema": "core"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(String(100), nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int | None] = mapped_column(Integer, nullable=True)
    action_type: Mapped[str] = mapped_column(ENUM(
        'learn_card', 'daily_challenge', 'checkin_milestone', 'create_note',
        'ad_watch', 'unlock_domain', 'unlock_card', 'exchange_achievement', 'admin_adjust',
        name='points_action_type', create_type=False
    ), nullable=False)
    reference_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
