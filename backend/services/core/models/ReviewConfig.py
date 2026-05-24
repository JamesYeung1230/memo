from sqlalchemy import Boolean, Integer, String, Time, text
from sqlalchemy.dialects.postgresql import JSONB, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.core.models.base import Base


class ReviewConfig(Base):
    __tablename__ = "review_config"
    __table_args__ = {"schema": "core"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    review_nodes: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'[1,2,4,7,15]'"))
    daily_limit: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("20"))
    forgotten_alert_days: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("7"))
    reminder_time: Mapped[str] = mapped_column(Time, nullable=False, server_default=text("'20:00'"))
    weekend_quiet: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    preset: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
