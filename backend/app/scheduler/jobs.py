import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.database import async_session
from app.services.risk_service import recompute_all_scores
from app.services.csn_service import sync_recent_csn_events
from app.services.openmeteo_service import update_climate_scores_from_real_data
from app.services.senapred_service import sync_senapred_alerts
from app.services.simulacro_service import sync_simulacros, prune_old_simulacros
from app.services.airechile_service import sync_airechile, prune_old_airechile
from app.services.sernageomin_service import sync_sernageomin_alerts
from app.services.sync_status_service import record_sync_run

logger = logging.getLogger("chilerisk.scheduler")

scheduler = AsyncIOScheduler(
    job_defaults={"misfire_grace_time": 120},
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _refresh_risk_scores():
    started = _utcnow()
    try:
        async with async_session() as session:
            updated = await recompute_all_scores(session)
            status = "ok" if updated else "empty"
            await record_sync_run(
                session,
                job_id="risk_refresh",
                started_at=started,
                status=status,
                items_written=updated,
            )
        logger.info("Risk scores refreshed for %d comunas", updated)
    except Exception as e:
        logger.exception("Risk refresh failed: %s", e)
        try:
            async with async_session() as session:
                await record_sync_run(
                    session,
                    job_id="risk_refresh",
                    started_at=started,
                    status="error",
                    error_text=str(e),
                )
        except Exception:
            logger.exception("Failed to persist risk_refresh sync run")


async def _sync_real_seismic_events():
    if not settings.use_real_csn:
        return
    started = _utcnow()
    try:
        async with async_session() as session:
            inserted = await sync_recent_csn_events(session, hours=168)
            status = "ok" if inserted else "empty"
            await record_sync_run(
                session,
                job_id="csn_sync",
                started_at=started,
                status=status,
                items_written=inserted,
            )
        if inserted:
            logger.info("Synced %d new real seismic events from CSN (sismologia.cl)", inserted)
        else:
            logger.warning("CSN sync finished with 0 new events")
    except Exception as e:
        logger.exception("CSN sync failed: %s", e)
        try:
            async with async_session() as session:
                await record_sync_run(
                    session,
                    job_id="csn_sync",
                    started_at=started,
                    status="error",
                    error_text=str(e),
                )
        except Exception:
            logger.exception("Failed to persist csn_sync sync run")


async def _update_real_climate_scores():
    if not settings.use_real_meteo:
        return
    started = _utcnow()
    try:
        async with async_session() as session:
            updated = await update_climate_scores_from_real_data(session)
            status = "ok" if updated else "empty"
            await record_sync_run(
                session,
                job_id="meteo_update",
                started_at=started,
                status=status,
                items_written=updated,
            )
        if updated:
            logger.info("Updated climate scores from Open-Meteo for %d comunas", updated)
        else:
            logger.warning("Open-Meteo update finished with 0 comunas")
    except Exception as e:
        logger.exception("Open-Meteo update failed: %s", e)
        try:
            async with async_session() as session:
                await record_sync_run(
                    session,
                    job_id="meteo_update",
                    started_at=started,
                    status="error",
                    error_text=str(e),
                )
        except Exception:
            logger.exception("Failed to persist meteo_update sync run")


async def _sync_senapred_alerts():
    if not settings.use_real_senapred:
        return
    started = _utcnow()
    try:
        async with async_session() as session:
            n_alertas, n_eventos = await sync_senapred_alerts(session)
            total = n_alertas + n_eventos
            status = "ok" if total else "empty"
            await record_sync_run(
                session,
                job_id="senapred_sync",
                started_at=started,
                status=status,
                items_written=total,
            )
        if n_alertas or n_eventos:
            logger.info(
                "Synced %d SERNAPRED alertas + %d eventos (Sismos y otros)",
                n_alertas,
                n_eventos,
            )
        else:
            logger.warning("SERNAPRED sync finished with 0 alertas/eventos")
    except Exception as e:
        logger.exception("SERNAPRED sync failed: %s", e)
        try:
            async with async_session() as session:
                await record_sync_run(
                    session,
                    job_id="senapred_sync",
                    started_at=started,
                    status="error",
                    error_text=str(e),
                )
        except Exception:
            logger.exception("Failed to persist senapred_sync sync run")


async def _sync_simulacros():
    started = _utcnow()
    try:
        async with async_session() as session:
            n = await sync_simulacros(session)
            pruned = await prune_old_simulacros(
                session, lookback_days=settings.simulacros_lookback_days
            )
            status = "ok" if (n or pruned) else "empty"
            await record_sync_run(
                session,
                job_id="simulacros_sync",
                started_at=started,
                status=status,
                items_written=n,
            )
        if n or pruned:
            logger.info("Synced %d SERNAPRED simulacros (pruned %d)", n, pruned)
        else:
            logger.warning("Simulacros sync finished with 0 upserts")
    except Exception as e:
        logger.exception("SERNAPRED simulacros sync failed: %s", e)
        try:
            async with async_session() as session:
                await record_sync_run(
                    session,
                    job_id="simulacros_sync",
                    started_at=started,
                    status="error",
                    error_text=str(e),
                )
        except Exception:
            logger.exception("Failed to persist simulacros_sync sync run")


async def _sync_airechile():
    if not settings.use_real_airechile:
        return
    started = _utcnow()
    try:
        async with async_session() as session:
            n = await sync_airechile(session)
            pruned = await prune_old_airechile(session)
            status = "ok" if (n or pruned) else "empty"
            await record_sync_run(
                session,
                job_id="airechile_sync",
                started_at=started,
                status=status,
                items_written=n,
            )
        if n or pruned:
            logger.info("Synced %d Aire Chile zones (pruned %d)", n, pruned)
        else:
            logger.warning("Aire Chile sync finished with 0 upserts")
    except Exception as e:
        logger.exception("Aire Chile sync failed: %s", e)
        try:
            async with async_session() as session:
                await record_sync_run(
                    session,
                    job_id="airechile_sync",
                    started_at=started,
                    status="error",
                    error_text=str(e),
                )
        except Exception:
            logger.exception("Failed to persist airechile_sync sync run")


async def _sync_sernageomin():
    if not settings.use_real_sernageomin:
        return
    started = _utcnow()
    try:
        async with async_session() as session:
            n = await sync_sernageomin_alerts(session)
            status = "ok" if n else "empty"
            await record_sync_run(
                session,
                job_id="sernageomin_sync",
                started_at=started,
                status=status,
                items_written=n,
            )
        if n:
            logger.info("Synced %d SERNAGEOMIN volcanic alerts", n)
        else:
            logger.warning("SERNAGEOMIN sync finished with 0 alerts")
    except Exception as e:
        logger.exception("SERNAGEOMIN sync failed: %s", e)
        try:
            async with async_session() as session:
                await record_sync_run(
                    session,
                    job_id="sernageomin_sync",
                    started_at=started,
                    status="error",
                    error_text=str(e),
                )
        except Exception:
            logger.exception("Failed to persist sernageomin_sync sync run")


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

    scheduler.add_job(
        _sync_simulacros,
        trigger=IntervalTrigger(minutes=settings.simulacros_refresh_minutes),
        id="simulacros_sync",
        name="Sync SERNAPRED simulacros calendar",
        replace_existing=True,
    )

    if settings.use_real_airechile:
        scheduler.add_job(
            _sync_airechile,
            trigger=IntervalTrigger(minutes=settings.airechile_refresh_minutes),
            id="airechile_sync",
            name="Sync Aire Chile GEC conditions",
            replace_existing=True,
        )

    if settings.use_real_sernageomin:
        scheduler.add_job(
            _sync_sernageomin,
            trigger=IntervalTrigger(minutes=settings.sernageomin_refresh_minutes),
            id="sernageomin_sync",
            name="Sync SERNAGEOMIN volcanic alerts",
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
    logger.info(
        "SERNAPRED simulacros sync enabled (every %d min)",
        settings.simulacros_refresh_minutes,
    )
    if settings.use_real_airechile:
        logger.info(
            "Aire Chile GEC sync enabled (every %d min)",
            settings.airechile_refresh_minutes,
        )
    if settings.use_real_sernageomin:
        logger.info(
            "SERNAGEOMIN volcanic alerts sync enabled (every %d min)",
            settings.sernageomin_refresh_minutes,
        )


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down")
