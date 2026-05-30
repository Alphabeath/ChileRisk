from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ClimateReading(Base):
    __tablename__ = "climate_readings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cod_comuna: Mapped[int] = mapped_column(Integer, nullable=False)
    temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    wind_speed_kmh: Mapped[float] = mapped_column(Float, nullable=False)
    ola_calor_score: Mapped[float] = mapped_column(Float, default=0.0)
    ola_frio_score: Mapped[float] = mapped_column(Float, default=0.0)
    viento_score: Mapped[float] = mapped_column(Float, default=0.0)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(String(20), default="openmeteo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_climate_comuna_time", "cod_comuna", "measured_at"),
    )
