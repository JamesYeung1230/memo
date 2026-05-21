from sqlalchemy import Boolean, CHAR, String, text
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.core.models.base import Base


class AnswerRecord(Base):
    __tablename__ = "answer_record"
    __table_args__ = {"schema": "core"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    question_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    card_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    domain_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    selected_option: Mapped[str] = mapped_column(CHAR(1), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_daily_challenge: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    challenge_date: Mapped[str | None] = mapped_column(String, nullable=True)
    answered_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
