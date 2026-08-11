from datetime import date as date_cls, datetime

from sqlalchemy import Boolean, Date, DateTime, Index, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Simulacro(Base):
    """Drill (simulacro) scraped from the public SERNAPRED calendar.

    Slug is the WordPress post_name (stable, unique). The model stores
    both upcoming and past drills; the API filters by date window.
    """

    __tablename__ = "simulacros"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    drill_date: Mapped[date_cls] = mapped_column(Date, nullable=False, index=True)
    region_code: Mapped[int | None] = mapped_column(Integer, index=True)
    region_name: Mapped[str | None] = mapped_column(String(128))
    drill_type: Mapped[str] = mapped_column(String(64), nullable=False, default="otro")
    participating_comunas: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    detail_url: Mapped[str] = mapped_column(String(512), nullable=False)
    mensaje_sae: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="future")
    headline: Mapped[str | None] = mapped_column(String(512))
    schedule_note: Mapped[str | None] = mapped_column(String(256))
    hero_image_url: Mapped[str | None] = mapped_column(String(768))
    detail_body: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_simulacros_date_region", "drill_date", "region_code"),
        Index("ix_simulacros_type_date", "drill_type", "drill_date"),
    )
