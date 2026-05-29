"""Comuna detail endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.comuna import Comuna
from app.services.risk_service import get_latest_risk_for_comuna

router = APIRouter()


@router.get("/{cod_comuna}/risk")
async def get_comuna_risk(cod_comuna: int, db: AsyncSession = Depends(get_db)):
    """Latest risk scores for a specific comuna."""
    score = await get_latest_risk_for_comuna(db, cod_comuna)
    if not score:
        raise HTTPException(status_code=404, detail="No risk data for this comuna")

    comuna = await db.get(Comuna, cod_comuna)
    name = comuna.name if comuna else "Desconocida"

    return {
        "cod_comuna": cod_comuna,
        "name": name,
        "codregion": comuna.codregion if comuna else None,
        "sismo_score": score.sismo_score,
        "ola_calor_score": score.ola_calor_score,
        "ola_frio_score": score.ola_frio_score,
        "viento_score": score.viento_score,
        "composite_score": score.composite_score,
        "dominant_hazard": score.dominant_hazard,
        "severity": score.severity,
        "computed_at": score.computed_at,
    }
