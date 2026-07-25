"""Meeting points for evacuation (tsunami / volcanic) — seeded from KMZ JSON."""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MeetingPoint(Base):
    __tablename__ = "meeting_points"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    hazard: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    comuna: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    provincia: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    region: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    sector: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    # Optional CUT when known from source metadata (not always present)
    comuna_code: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
