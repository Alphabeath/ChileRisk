from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limiter import limiter
from app.database import get_db
from app.schemas.system import SyncRunOut, SyncStatusResponse
from app.services.sync_status_service import latest_sync_runs

router = APIRouter()


@router.get("/sync-status", response_model=SyncStatusResponse)
@limiter.limit("30/minute")
async def sync_status(request: Request, db: AsyncSession = Depends(get_db)):
    rows = await latest_sync_runs(db)
    return SyncStatusResponse(runs=[SyncRunOut.model_validate(r) for r in rows])
