from sqlalchemy import Boolean, String, Text, text
from sqlalchemy.dialects.postgresql import ENUM, JSONB, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.core.models.base import Base


class Note(Base):
    __tablename__ = "note"
    __table_args__ = {"schema": "core"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True, server_default=text("'[]'"))
    associated_card_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    audit_status: Mapped[str] = mapped_column(ENUM('draft', 'submitted', 'reviewing', 'approved', 'rejected', name='note_audit_status', create_type=False), nullable=False, server_default=text("'draft'"))
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    violation_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    submitted_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    deleted_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
