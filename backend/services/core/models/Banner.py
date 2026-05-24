from sqlalchemy import Integer, String, text
from sqlalchemy.dialects.postgresql import ENUM, UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from services.core.models.base import Base


class Banner(Base):
    __tablename__ = "banner"
    __table_args__ = {"schema": "core"}

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    title: Mapped[str] = mapped_column(String(50), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    link_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    link_param: Mapped[str | None] = mapped_column(String(200), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(ENUM('enabled', 'disabled', name='banner_status', create_type=False), nullable=False, server_default=text("'enabled'"))
    start_date: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    end_date: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    click_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    impression_pv: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    impression_uv: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    created_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
