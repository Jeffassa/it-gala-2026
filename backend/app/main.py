from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.v1 import (
    audit, auth, categories, certificates, galas, live, nominees,
    notifications, reports, scans, students, tickets, users, votes,
)
from app.core.config import settings
from app.core.database import Base, engine
from app.models import *  # noqa: F401,F403


def _ensure_columns() -> None:
    """Idempotent ALTER TABLE for new columns added after initial deploy."""
    insp = inspect(engine)
    if "galas" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("galas")}
    if "live_results_visible" not in cols:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE galas ADD COLUMN live_results_visible BOOLEAN DEFAULT FALSE"
            ))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_columns()
    yield


app = FastAPI(
    title="IT Awards 2026 — Gala API",
    version="1.0.0",
    description="API du gala IT Awards : auth, billetterie, scan QR, vote des nominés.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(users.router, prefix=api_v1_prefix)
app.include_router(galas.router, prefix=api_v1_prefix)
app.include_router(categories.router, prefix=api_v1_prefix)
app.include_router(nominees.router, prefix=api_v1_prefix)
app.include_router(tickets.router, prefix=api_v1_prefix)
app.include_router(votes.router, prefix=api_v1_prefix)
app.include_router(scans.router, prefix=api_v1_prefix)
app.include_router(reports.router, prefix=api_v1_prefix)
app.include_router(live.router, prefix=api_v1_prefix)
app.include_router(certificates.router, prefix=api_v1_prefix)
app.include_router(notifications.router, prefix=api_v1_prefix)
app.include_router(audit.router, prefix=api_v1_prefix)
app.include_router(students.router, prefix=api_v1_prefix)
