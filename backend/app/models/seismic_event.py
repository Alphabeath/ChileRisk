from datetime import datetime

from sqlalchemy import String, Float, DateTime, func, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SeismicEvent(Base):
    __tablename__ = "seismic_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    magnitude: Mapped[float] = mapped_column(Float, nullable=False)
    depth_km: Mapped[float] = mapped_column(Float, default=30.0)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    occurred_at_local: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))
    source: Mapped[str] = mapped_column(String(20), default="mock")
    raw_data: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_event_time", "occurred_at"),
        Index("idx_event_source", "source"),
    )
