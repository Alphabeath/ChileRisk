from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.risk import ComunaMapScore
from app.services.region_service import get_all_regions_aggregated
from app.services.risk_service import get_comuna_map_scores as get_comuna_map_scores_service

router = APIRouter()


@router.get("/national", response_model=list[dict])
@limiter.limit("100/minute")
async def get_national_risk(request: Request, db: AsyncSession = Depends(get_db)):
    data = await get_all_regions_aggregated(db)
    return data


@router.get("/comunas", response_model=list[ComunaMapScore])
@limiter.limit("100/minute")
async def get_comuna_map_scores(request: Request, db: AsyncSession = Depends(get_db)):
    """Lightweight scores for map coloring only (composite_score per comuna)."""
    data = await get_comuna_map_scores_service(db)
    return data
