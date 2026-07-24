import logging
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import alerts, auth, air_quality, comunas, events, family_plan, regiones, risk, simulacros, stats, system
from app.core.auth import get_current_user
from app.config import settings
from app.core.limiter import limiter
from app.data.seed_comunas import seed_comunas
from app.data.seed_regions import seed_regions
from app.database import async_session
import app.models  # noqa: F401 — register ORM metadata
from app.scheduler import setup_scheduler, shutdown_scheduler
from app.schemas.system import HealthSyncSummary
from app.services.csn_service import sync_recent_csn_events
from app.services.risk_service import ensure_risk_scores_exist, recompute_all_scores
from app.services.sync_status_service import latest_sync_runs

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logging.getLogger("chilerisk").setLevel(logging.INFO)
logging.getLogger("chilerisk.scheduler").setLevel(logging.INFO)
logging.getLogger("apscheduler").setLevel(logging.INFO)

_start_time = time.time()
logger = logging.getLogger("chilerisk")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is applied by Alembic (scripts/entrypoint.sh) before uvicorn starts.
    # Seed reference geography (regions + comunas)
    async with async_session() as session:
        n_regions = await seed_regions(session)
        n_comunas = await seed_comunas(session)
        if n_regions or n_comunas:
            logger.info("Seeded %d regions and %d comunas", n_regions, n_comunas)

        n_scores = await ensure_risk_scores_exist(session)
        if n_scores:
            logger.info("Ensured %d initial zeroed risk scores for comunas", n_scores)

        if settings.use_real_csn:
            real_events = await sync_recent_csn_events(session, hours=168)
            if real_events:
                logger.info("Synced %d real seismic events from CSN (sismologia.cl) at startup", real_events)

        if settings.use_real_meteo:
            from app.services.openmeteo_service import update_climate_scores_from_real_data

            n_climate = await update_climate_scores_from_real_data(session)
            if n_climate:
                logger.info("Updated %d comunas with real climate data from Open-Meteo at startup", n_climate)

        if settings.use_real_senapred:
            from app.services.senapred_service import sync_senapred_alerts

            try:
                n_alertas, n_eventos = await sync_senapred_alerts(session)
                if n_alertas or n_eventos:
                    logger.info(
                        "Synced %d SERNAPRED alertas + %d eventos at startup",
                        n_alertas,
                        n_eventos,
                    )
            except Exception as e:
                await session.rollback()
                logger.exception("Initial SERNAPRED sync failed: %s", e)

        from app.services.simulacro_service import sync_simulacros, prune_old_simulacros

        try:
            n_sim = await sync_simulacros(session)
            if n_sim:
                logger.info("Synced %d SERNAPRED simulacros at startup", n_sim)
            await prune_old_simulacros(
                session, lookback_days=settings.simulacros_lookback_days
            )
        except Exception as e:
            await session.rollback()
            logger.exception("Initial simulacros sync failed: %s", e)

        if settings.use_real_airechile:
            from app.services.airechile_service import sync_airechile, prune_old_airechile

            try:
                n_air = await sync_airechile(session)
                if n_air:
                    logger.info("Synced %d Aire Chile zones at startup", n_air)
                await prune_old_airechile(session)
            except Exception as e:
                await session.rollback()
                logger.exception("Initial Aire Chile sync failed: %s", e)

        n_recomputed = await recompute_all_scores(session)
        if n_recomputed:
            logger.info("Initial risk recompute applied seismic impacts to %d comunas", n_recomputed)

        from app.services.region_service import _national_cache, _region_cache
        _national_cache.clear()
        _region_cache.clear()

    setup_scheduler()

    yield

    shutdown_scheduler()


app = FastAPI(
    title="ChileRisk API",
    description="Monitoreo de riesgos multi-amenaza para Chile (comunas y regiones)",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again later."},
    )

# Routers
_auth_guard = [Depends(get_current_user)]
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(
    risk.router, prefix="/api/v1/risk", tags=["risk"], dependencies=_auth_guard
)
app.include_router(
    regiones.router, prefix="/api/v1/regiones", tags=["regiones"], dependencies=_auth_guard
)
app.include_router(
    comunas.router, prefix="/api/v1/comunas", tags=["comunas"], dependencies=_auth_guard
)
app.include_router(
    events.router, prefix="/api/v1/events", tags=["events"], dependencies=_auth_guard
)
app.include_router(
    alerts.router, prefix="/api/v1/alerts", tags=["alerts"], dependencies=_auth_guard
)
app.include_router(
    stats.router, prefix="/api/v1/stats", tags=["stats"], dependencies=_auth_guard
)
app.include_router(
    family_plan.router,
    prefix="/api/v1/family-plan",
    tags=["family-plan"],
    dependencies=_auth_guard,
)
app.include_router(
    simulacros.router,
    prefix="/api/v1/simulacros",
    tags=["simulacros"],
    dependencies=_auth_guard,
)
app.include_router(
    air_quality.router,
    prefix="/api/v1/air-quality",
    tags=["air-quality"],
    dependencies=_auth_guard,
)
app.include_router(
    system.router,
    prefix="/api/v1/system",
    tags=["system"],
    dependencies=_auth_guard,
)


@app.get("/health", tags=["system"])
async def health():
    sync_summary: list[HealthSyncSummary] = []
    try:
        async with async_session() as session:
            rows = await latest_sync_runs(session)
            sync_summary = [
                HealthSyncSummary(
                    job_id=r.job_id,
                    status=r.status,
                    finished_at=r.finished_at,
                )
                for r in rows
            ]
    except Exception:
        logger.exception("health: failed to load sync summary")

    return {
        "status": "ok",
        "version": "0.1.0",
        "uptime_seconds": round(time.time() - _start_time, 1),
        "sync": sync_summary,
    }
