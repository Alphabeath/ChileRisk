"""Region detail endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.services.region_service import get_region_aggregated_risk
from app.services.risk_service import get_latest_risks_for_region

router = APIRouter()


@router.get("/{codregion}/risk")
async def get_region_risk(codregion: int, db: AsyncSession = Depends(get_db)):
    """Detailed risk for one region + list of its comunas with scores."""
    region_data = await get_region_aggregated_risk(db, codregion)
    if not region_data:
        raise HTTPException(status_code=404, detail="Region not found")

    comuna_scores = await get_latest_risks_for_region(db, codregion)

    return {
        **region_data,
        "comunas": [
            {
                "cod_comuna": s.cod_comuna,
                "sismo_score": s.sismo_score,
                "ola_calor_score": s.ola_calor_score,
                "ola_frio_score": s.ola_frio_score,
                "viento_score": s.viento_score,
                "composite_score": s.composite_score,
                "dominant_hazard": s.dominant_hazard,
                "severity": s.severity,
            }
            for s in comuna_scores
        ],
    }
