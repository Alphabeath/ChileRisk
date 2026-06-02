import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.database import async_session
from app.services.risk_service import recompute_all_scores
from app.services.csn_service import sync_recent_csn_events
from app.services.openmeteo_service import update_climate_scores_from_real_data
from app.services.senapred_service import sync_senapred_alerts

logger = logging.getLogger("chilerisk.scheduler")

scheduler = AsyncIOScheduler()


async def _refresh_risk_scores():
    async with async_session() as session:
        updated = await recompute_all_scores(session)
        logger.info("Risk scores refreshed for %d comunas", updated)


async def _sync_real_seismic_events():
    if not settings.use_real_csn:
        return
    async with async_session() as session:
        inserted = await sync_recent_csn_events(session, hours=48)
        if inserted:
            logger.info("Synced %d new real seismic events from CSN (sismologia.cl)", inserted)


async def _update_real_climate_scores():
    if not settings.use_real_meteo:
        return
    async with async_session() as session:
        updated = await update_climate_scores_from_real_data(session)
        if updated:
            logger.info("Updated climate scores from Open-Meteo for %d comunas", updated)


async def _sync_senapred_alerts():
    if not settings.use_real_senapred:
        return
    try:
        async with async_session() as session:
            inserted = await sync_senapred_alerts(session)
        if inserted:
            logger.info("Synced %d SERNAPRED alerts", inserted)
    except Exception as e:
        logger.exception("SERNAPRED sync failed: %s", e)


def setup_scheduler():
    if not settings.enable_scheduler:
        logger.info("Scheduler disabled via settings")
        return

    scheduler.add_job(
        _refresh_risk_scores,
        trigger=IntervalTrigger(minutes=settings.risk_refresh_minutes),
        id="risk_refresh",
        name="Recompute risk scores",
        replace_existing=True,
    )

    if settings.use_real_csn:
        scheduler.add_job(
            _sync_real_seismic_events,
            trigger=IntervalTrigger(minutes=5),
            id="csn_sync",
            name="Sync real seismic events from CSN (sismologia.cl)",
            replace_existing=True,
        )

    if settings.use_real_meteo:
        scheduler.add_job(
            _update_real_climate_scores,
            trigger=IntervalTrigger(minutes=60),
            id="meteo_update",
            name="Update climate scores from Open-Meteo",
            replace_existing=True,
        )

    if settings.use_real_senapred:
        scheduler.add_job(
            _sync_senapred_alerts,
            trigger=IntervalTrigger(minutes=settings.senapred_refresh_minutes),
            id="senapred_sync",
            name="Sync SERNAPRED alerts",
            replace_existing=True,
        )

    scheduler.start()
    logger.info("APScheduler started — risk refresh every %d minutes", settings.risk_refresh_minutes)
    if settings.use_real_csn:
        logger.info("CSN (sismologia.cl) real seismic sync enabled (every 5 min)")
    if settings.use_real_meteo:
        logger.info("Open-Meteo real climate updates enabled (every 45 min)")
    if settings.use_real_senapred:
        logger.info(
            "SERNAPRED alerts sync enabled (every %d min)",
            settings.senapred_refresh_minutes,
        )


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down")
