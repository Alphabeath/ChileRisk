"""
Background scheduler for ChileRisk MVP.

Refreshes mock risk scores periodically so the map and detail views show "live" evolution.
"""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.database import async_session
from app.services.risk_service import recompute_all_scores

logger = logging.getLogger("chilerisk.scheduler")

scheduler = AsyncIOScheduler()


async def _refresh_risk_scores():
    async with async_session() as session:
        updated = await recompute_all_scores(session)
        logger.info("Risk scores refreshed for %d comunas", updated)


def setup_scheduler():
    if not settings.enable_scheduler:
        logger.info("Scheduler disabled via settings")
        return

    scheduler.add_job(
        _refresh_risk_scores,
        trigger=IntervalTrigger(minutes=settings.mock_refresh_minutes),
        id="risk_refresh",
        name="Recompute mock risk scores",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started — risk refresh every %d minutes", settings.mock_refresh_minutes)


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down")
