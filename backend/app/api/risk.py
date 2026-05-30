from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.services.region_service import get_all_regions_aggregated

router = APIRouter()


@router.get("/national", response_model=list[dict])
@limiter.limit("100/minute")
async def get_national_risk(request: Request, db: AsyncSession = Depends(get_db)):
    data = await get_all_regions_aggregated(db)
    return data
