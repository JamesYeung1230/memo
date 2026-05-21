from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.core.models.base import Base


class UserAchievement(Base):
    __tablename__ = "user_achievement"
    __table_args__ = {"schema": "core"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    achievement_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    obtained_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
