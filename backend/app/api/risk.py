"""National and map-level risk endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.services.region_service import get_all_regions_aggregated

router = APIRouter()


@router.get("/national", response_model=list[dict])
async def get_national_risk(db: AsyncSession = Depends(get_db)):
    """Return aggregated risk for all 16 regions (for the interactive map)."""
    data = await get_all_regions_aggregated(db)
    return data
