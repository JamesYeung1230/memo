from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import ENUM, JSONB, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.knowledge.models.base import Base


class Card(Base):
    __tablename__ = "card"
    __table_args__ = {"schema": "knowledge"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    chapter_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("knowledge.chapter.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    core_concept: Mapped[str] = mapped_column(String(200), nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    life_analogy: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'[]'"))
    difficulty: Mapped[str] = mapped_column(ENUM('beginner', 'intermediate', 'advanced', name='card_difficulty', create_type=False), nullable=False, server_default=text("'beginner'"))
    is_premium: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    unlock_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(ENUM('draft', 'published', name='content_status', create_type=False), nullable=False, server_default=text("'draft'"))
    deleted_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
