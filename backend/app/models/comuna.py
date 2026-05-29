from sqlalchemy import String, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Comuna(Base):
    __tablename__ = "comunas"

    cod_comuna: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    provincia: Mapped[str] = mapped_column(String(100), nullable=False)
    codregion: Mapped[int] = mapped_column(Integer, ForeignKey("regions.codregion"), nullable=False, index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    area_km: Mapped[float] = mapped_column(Float, default=0.0)
