from datetime import datetime

from sqlalchemy import Float, Integer, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SeismicImpact(Base):
    __tablename__ = "seismic_impacts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, nullable=False)
    cod_comuna: Mapped[int] = mapped_column(Integer, nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_intensity: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_impact_event", "event_id"),
        Index("idx_impact_comuna", "cod_comuna"),
        Index("idx_impact_event_comuna", "event_id", "cod_comuna", unique=True),
    )
