from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.schemas.stats import (
    CompareOut,
    NationalStatsOut,
    RegionStatsOut,
    TrendsOut,
)
from app.services.stats_service import (
    compare_regions,
    get_national_stats,
    get_region_stats,
    get_trends,
)

router = APIRouter()


@router.get("/national", response_model=NationalStatsOut)
@limiter.limit("100/minute")
async def national_stats(
    request: Request, db: AsyncSession = Depends(get_db)
) -> NationalStatsOut:
    return await get_national_stats(db)


@router.get("/regiones/{codregion}", response_model=RegionStatsOut)
@limiter.limit("100/minute")
async def region_stats(
    request: Request,
    codregion: int = Path(ge=1, le=16),
    db: AsyncSession = Depends(get_db),
) -> RegionStatsOut:
    data = await get_region_stats(db, codregion)
    if data is None:
        raise HTTPException(status_code=404, detail="Region not found")
    return data


@router.get("/trends", response_model=TrendsOut)
@limiter.limit("50/minute")
async def trends(
    request: Request,
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
) -> TrendsOut:
    return await get_trends(db, days)


@router.get("/compare", response_model=CompareOut)
@limiter.limit("50/minute")
async def compare(
    request: Request,
    codregions: str = Query(
        ...,
        pattern=r"^\d+(,\d+){0,7}$",
        description="Comma-separated region codes (max 8)",
    ),
    db: AsyncSession = Depends(get_db),
) -> CompareOut:
    codes = [int(x.strip()) for x in codregions.split(",") if x.strip().isdigit()]
    return await compare_regions(db, codes[:8])
