from sqlalchemy import ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import ENUM, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from services.knowledge.models.base import Base


class AiGenerationHistory(Base):
    __tablename__ = "ai_generation_history"
    __table_args__ = {"schema": "knowledge"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    generation_type: Mapped[str] = mapped_column(String(20), nullable=False)
    topic: Mapped[str] = mapped_column(String(200), nullable=False)
    source_card_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("knowledge.card.id", ondelete="SET NULL"), nullable=True)
    chapter_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("knowledge.chapter.id", ondelete="SET NULL"), nullable=True)
    task_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    task_status: Mapped[str] = mapped_column(ENUM('processing', 'completed', 'failed', name='ai_task_status', create_type=False), nullable=False, server_default=text("'processing'"))
    generated_content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    admin_edited_content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
