from sqlalchemy import Boolean, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.core.models.base import Base


class DailyChallengeRecord(Base):
    __tablename__ = "daily_challenge_record"
    __table_args__ = {"schema": "core"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(String(100), nullable=False)
    challenge_date: Mapped[str] = mapped_column(String, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    all_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    points_earned: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    streak_days: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
