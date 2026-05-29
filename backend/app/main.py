import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, comunas, events, regiones, risk
from app.config import settings
from app.data.seed_comunas import seed_comunas
from app.data.seed_regions import seed_regions
from app.database import async_session, engine, Base
from app.scheduler import setup_scheduler, shutdown_scheduler
from app.services.mock_service import generate_initial_seismic_events, seed_initial_risk_scores

_start_time = time.time()
logger = logging.getLogger("chilerisk")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (idempotent for MVP)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed reference geography (regions + comunas)
    async with async_session() as session:
        n_regions = await seed_regions(session)
        n_comunas = await seed_comunas(session)
        if n_regions or n_comunas:
            logger.info("Seeded %d regions and %d comunas", n_regions, n_comunas)

        # Seed initial seismic events + risk scores (idempotent)
        n_events = await generate_initial_seismic_events(session)
        n_scores = await seed_initial_risk_scores(session)
        if n_scores:
            logger.info("Generated %d initial seismic events and %d risk scores", len(n_events), n_scores)

    # Start background mock refresh
    setup_scheduler()

    yield

    shutdown_scheduler()


app = FastAPI(
    title="ChileRisk API",
    description="Monitoreo de riesgos multi-amenaza para Chile (comunas y regiones)",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# Routers
app.include_router(risk.router, prefix="/api/v1/risk", tags=["risk"])
app.include_router(regiones.router, prefix="/api/v1/regiones", tags=["regiones"])
app.include_router(comunas.router, prefix="/api/v1/comunas", tags=["comunas"])
app.include_router(events.router, prefix="/api/v1/events", tags=["events"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])


@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "ok",
        "version": "0.1.0",
        "uptime_seconds": round(time.time() - _start_time, 1),
    }
