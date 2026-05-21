from sqlalchemy import Boolean, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import ENUM, JSONB, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.knowledge.models.base import Base


class ReviewRecord(Base):
    __tablename__ = "review_record"
    __table_args__ = {"schema": "knowledge"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    note_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    author_id: Mapped[str] = mapped_column(String(64), nullable=False)
    note_title: Mapped[str] = mapped_column(String(300), nullable=False)
    note_content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(ENUM('screening', 'ai_review', 'pending_manual', 'approved', 'rejected', name='review_status', create_type=False), nullable=False, server_default=text("'screening'"))
    risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_labels: Mapped[dict | None] = mapped_column(JSONB, nullable=True, server_default=text("'[]'"))
    sensitive_words_hit: Mapped[dict | None] = mapped_column(JSONB, nullable=True, server_default=text("'[]'"))
    ai_risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_risk_labels: Mapped[dict | None] = mapped_column(JSONB, nullable=True, server_default=text("'[]'"))
    ai_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    needs_manual_review: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    ai_status: Mapped[str] = mapped_column(ENUM('normal', 'error', name='ai_status_flag', create_type=False), nullable=False, server_default=text("'normal'"))
    manual_reviewer: Mapped[str | None] = mapped_column(String(50), nullable=True)
    manual_result: Mapped[str | None] = mapped_column(ENUM('approved', 'rejected', name='manual_result', create_type=False), nullable=True)
    manual_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
