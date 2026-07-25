"""Volcanic alert levels scraped from sernageomin.cl/alertas-volcanicas."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SernageominVolcanicAlert(Base):
    """One row per volcano currently (or recently) listed with an elevated alert."""

    __tablename__ = "sernageomin_volcanic_alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    volcano_key: Mapped[str] = mapped_column(String(96), nullable=False)
    volcano_name: Mapped[str] = mapped_column(String(200), nullable=False)
    level: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(400), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    region_code: Mapped[int | None] = mapped_column(Integer, index=True)
    region_name: Mapped[str | None] = mapped_column(String(120))
    affected_scope: Mapped[str] = mapped_column(String(16), default="unknown", nullable=False)
    comuna_codes: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    external_url: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    page_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    raw: Mapped[dict | None] = mapped_column(JSON)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("volcano_key", name="uq_sernageomin_volcano_key"),
        Index("ix_sernageomin_active_level", "is_active", "level"),
    )
