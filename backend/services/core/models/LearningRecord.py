from sqlalchemy import Integer, String, text
from sqlalchemy.dialects.postgresql import ENUM, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.core.models.base import Base


class LearningRecord(Base):
    __tablename__ = "learning_record"
    __table_args__ = {"schema": "core"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    card_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    chapter_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    status: Mapped[str] = mapped_column(ENUM('not_learned', 'learning', 'mastered', name='learning_status', create_type=False), nullable=False, server_default=text("'learning'"))
    learned_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    next_review_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
