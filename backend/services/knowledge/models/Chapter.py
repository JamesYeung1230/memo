from sqlalchemy import ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import ENUM, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.knowledge.models.base import Base


class Chapter(Base):
    __tablename__ = "chapter"
    __table_args__ = {"schema": "knowledge"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    domain_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("knowledge.domain.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(ENUM('draft', 'published', name='content_status', create_type=False), nullable=False, server_default=text("'published'"))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
