from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DailyRiskScore(Base):
    """Persisted risk snapshot per comuna for one Chile calendar day (alert gating)."""

    __tablename__ = "daily_risk_scores"

    score_date: Mapped[date] = mapped_column(Date, primary_key=True)
    cod_comuna: Mapped[int] = mapped_column(Integer, primary_key=True)

    sismo_score: Mapped[float] = mapped_column(Float, default=0.0)
    ola_calor_score: Mapped[float] = mapped_column(Float, default=0.0)
    ola_frio_score: Mapped[float] = mapped_column(Float, default=0.0)
    viento_score: Mapped[float] = mapped_column(Float, default=0.0)
    inundacion_score: Mapped[float] = mapped_column(Float, default=0.0)

    composite_score: Mapped[float] = mapped_column(Float, default=0.0)
    dominant_hazard: Mapped[str] = mapped_column(String(20), default="sismo")
    severity: Mapped[str] = mapped_column(String(20), default="bajo")

    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )