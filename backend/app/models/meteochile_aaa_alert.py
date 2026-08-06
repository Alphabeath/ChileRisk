"""Persisted MeteoChile DMC AAA (Aviso / Alerta / Alarma) rows."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MeteoChileAaaAlert(Base):
    """One row per AAA item × CUT region (multi-region fan-out)."""

    __tablename__ = "meteochile_aaa_alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # Natural key: "{aaa_id}:{region_code|na}"
    row_key: Mapped[str] = mapped_column(String(64), nullable=False)
    aaa_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    codigo_meteo: Mapped[str] = mapped_column(String(64), nullable=False)
    tipo: Mapped[str] = mapped_column(String(16), nullable=False)
    level: Mapped[str] = mapped_column(String(32), nullable=False)
    fenomeno: Mapped[str | None] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    region_code: Mapped[int | None] = mapped_column(Integer, index=True)
    region_name: Mapped[str | None] = mapped_column(String(120))
    affected_scope: Mapped[str] = mapped_column(
        String(16), default="region", nullable=False
    )
    comuna_codes: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    zone_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    external_url: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    valid_from: Mapped[str | None] = mapped_column(String(200))
    valid_until: Mapped[str | None] = mapped_column(String(200))
    raw: Mapped[dict | None] = mapped_column(JSON)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("row_key", name="uq_meteochile_aaa_row_key"),
        Index("ix_meteochile_aaa_active_level", "is_active", "level"),
    )
