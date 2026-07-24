"""Daily GEC condition snapshots scraped from airechile.mma.gob.cl."""

from datetime import date as date_cls, datetime

from sqlalchemy import Date, DateTime, Index, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AireChileDaily(Base):
    """One row per GEC zone per Chile calendar day."""

    __tablename__ = "airechile_daily"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    zone_slug: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    condition_date: Mapped[date_cls] = mapped_column(Date, nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(32), nullable=False)
    forecast_date: Mapped[date_cls | None] = mapped_column(Date)
    forecast_level: Mapped[str | None] = mapped_column(String(32))
    pm25_range_label: Mapped[str | None] = mapped_column(String(128))
    zone_name: Mapped[str] = mapped_column(String(160), nullable=False)
    region_code: Mapped[int | None] = mapped_column(Integer, index=True)
    comuna_codes: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    measures_current: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    restrictions_permanent: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    external_url: Mapped[str] = mapped_column(String(512), nullable=False)
    raw: Mapped[dict | None] = mapped_column(JSON)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("zone_slug", "condition_date", name="uq_airechile_zone_date"),
        Index("ix_airechile_daily_date_level", "condition_date", "level"),
    )
