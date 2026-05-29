from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime, func, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cod_comuna: Mapped[int] = mapped_column(Integer, index=True, nullable=False)

    sismo_score: Mapped[float] = mapped_column(Float, default=0.0)
    ola_calor_score: Mapped[float] = mapped_column(Float, default=0.0)
    ola_frio_score: Mapped[float] = mapped_column(Float, default=0.0)
    viento_score: Mapped[float] = mapped_column(Float, default=0.0)

    composite_score: Mapped[float] = mapped_column(Float, default=0.0)
    dominant_hazard: Mapped[str] = mapped_column(String(20), default="sismo")
    severity: Mapped[str] = mapped_column(String(20), default="bajo")

    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
