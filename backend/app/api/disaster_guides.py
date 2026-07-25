"""Public read-only endpoints for disaster preparedness guides."""

from fastapi import APIRouter, HTTPException

from app.schemas.disaster_guide import DisasterGuideListOut, DisasterGuideOut
from app.services.disaster_guide_service import get_disaster_guide, list_disaster_guides

router = APIRouter()


@router.get("", response_model=DisasterGuideListOut)
async def list_guides() -> DisasterGuideListOut:
    return DisasterGuideListOut(items=list_disaster_guides())


@router.get("/{slug}", response_model=DisasterGuideOut)
async def guide_detail(slug: str) -> DisasterGuideOut:
    guide = get_disaster_guide(slug)
    if guide is None:
        raise HTTPException(status_code=404, detail="Guide not found")
    return guide
