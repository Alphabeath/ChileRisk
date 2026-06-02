from datetime import datetime

from sqlalchemy import String, Text, DateTime, Boolean, Integer, JSON, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SenapredAlert(Base):
    __tablename__ = "senapred_alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    senapred_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(16), default="alerta", nullable=False)
    level: Mapped[str] = mapped_column(String(16), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    url_access: Mapped[str | None] = mapped_column(String(512))
    category: Mapped[str | None] = mapped_column(String(128))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_monitor: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    parent_id: Mapped[str | None] = mapped_column(String(64), index=True)
    senapred_issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    region_code: Mapped[int | None] = mapped_column(Integer, index=True)
    region_name: Mapped[str | None] = mapped_column(String(128))
    meta_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    raw: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    __table_args__ = (
        Index("ix_senapred_active", "is_active", "level", "senapred_issued_at"),
        Index("ix_senapred_region_active", "region_code", "is_active", "senapred_issued_at"),
    )
