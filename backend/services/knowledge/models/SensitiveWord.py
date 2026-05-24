from sqlalchemy import Boolean, String, text
from sqlalchemy.dialects.postgresql import ENUM, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.knowledge.models.base import Base


class SensitiveWord(Base):
    __tablename__ = "sensitive_word"
    __table_args__ = {"schema": "knowledge"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    word: Mapped[str] = mapped_column(String(100), nullable=False)
    match_mode: Mapped[str] = mapped_column(ENUM('exact', 'pinyin', 'homophone', 'regex', name='match_mode', create_type=False), nullable=False, server_default=text("'exact'"))
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
