"""Alert endpoints (stub for MVP)."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/active")
async def list_active_alerts():
    """Returns empty list in MVP. Will be populated when real alert sources are integrated."""
    return []
