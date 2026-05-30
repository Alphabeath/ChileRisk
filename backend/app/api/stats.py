from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.limiter import limiter
from app.services.stats_service import (
    compare_regions,
    get_national_stats,
    get_region_stats,
    get_trends,
)

router = APIRouter()


@router.get("/national")
@limiter.limit("100/minute")
async def national_stats(request: Request, db: AsyncSession = Depends(get_db)):
    return await get_national_stats(db)


@router.get("/regiones/{codregion}")
@limiter.limit("100/minute")
async def region_stats(request: Request, codregion: int, db: AsyncSession = Depends(get_db)):
    data = await get_region_stats(db, codregion)
    if data is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Region not found")
    return data


@router.get("/trends")
@limiter.limit("50/minute")
async def trends(request: Request, days: int = Query(7, ge=1, le=90), db: AsyncSession = Depends(get_db)):
    return await get_trends(db, days)


@router.get("/compare")
@limiter.limit("50/minute")
async def compare(request: Request, codregions: str = Query(..., description="Comma-separated region codes"), db: AsyncSession = Depends(get_db)):
    codes = [int(x.strip()) for x in codregions.split(",") if x.strip().isdigit()]
    return await compare_regions(db, codes[:8])
