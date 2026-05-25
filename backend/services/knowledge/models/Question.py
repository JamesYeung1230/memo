from sqlalchemy import CHAR, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from services.knowledge.models.base import Base


class Question(Base):
    __tablename__ = "question"
    __table_args__ = {"schema": "knowledge"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    card_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("knowledge.card.id", ondelete="CASCADE"), unique=True, nullable=False)
    question_text: Mapped[str] = mapped_column(String(1000), nullable=False)
    options: Mapped[dict] = mapped_column(JSONB, nullable=False)
    correct_option: Mapped[str] = mapped_column(CHAR(1), nullable=False)
    explanation: Mapped[str] = mapped_column(String(2000), nullable=False)
