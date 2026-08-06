"""Public read-only endpoints for disaster preparedness guides."""

from fastapi import APIRouter, HTTPException, Request

from app.core.limiter import limiter
from app.schemas.disaster_guide import DisasterGuideListOut, DisasterGuideOut
from app.services.disaster_guide_service import get_disaster_guide, list_disaster_guides

router = APIRouter()


@router.get("", response_model=DisasterGuideListOut)
@limiter.limit("60/minute")
async def list_guides(request: Request) -> DisasterGuideListOut:
    return DisasterGuideListOut(items=list_disaster_guides())


@router.get("/{slug}", response_model=DisasterGuideOut)
@limiter.limit("60/minute")
async def guide_detail(request: Request, slug: str) -> DisasterGuideOut:
    guide = get_disaster_guide(slug)
    if guide is None:
        raise HTTPException(status_code=404, detail="Guide not found")
    return guide
