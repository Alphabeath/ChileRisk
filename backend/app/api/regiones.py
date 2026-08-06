"""Region detail endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Path, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.risk import RegionRiskDetailResponse
from app.services.region_service import get_region_aggregated_risk
from app.services.risk_service import get_latest_risks_for_region

router = APIRouter()


@router.get("/{codregion}/risk", response_model=RegionRiskDetailResponse)
@limiter.limit("60/minute")
async def get_region_risk(
    request: Request,
    codregion: int = Path(ge=1, le=16),
    db: AsyncSession = Depends(get_db),
) -> RegionRiskDetailResponse:
    """Detailed risk for one region + list of its comunas with scores."""
    region_data = await get_region_aggregated_risk(db, codregion)
    if not region_data:
        raise HTTPException(status_code=404, detail="Region not found")

    comuna_scores = await get_latest_risks_for_region(db, codregion)

    return RegionRiskDetailResponse(
        **region_data,
        comunas=[
            {
                "cod_comuna": s.cod_comuna,
                "sismo_score": s.sismo_score,
                "ola_calor_score": s.ola_calor_score,
                "ola_frio_score": s.ola_frio_score,
                "viento_score": s.viento_score,
                "inundacion_score": s.inundacion_score,
                "composite_score": s.composite_score,
                "dominant_hazard": s.dominant_hazard,
                "severity": s.severity,
            }
            for s in comuna_scores
        ],
    )
