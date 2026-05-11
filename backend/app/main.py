import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import inspect, text
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1 import (
    audit,
    auth,
    categories,
    certificates,
    galas,
    live,
    nominees,
    notifications,
    reports,
    scans,
    students,
    tickets,
    users,
    votes,
    souvenirs,
)
from app.core.config import settings
from app.core.database import Base, engine
from app.core.limiter import limiter
from app.models import *  # noqa: F401,F403

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Ajoute des headers HTTP de securite sur toutes les reponses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Empeche les navigateurs de deviner le MIME (anti MIME-sniffing XSS)
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Empeche le clickjacking : aucune iframe externe
        response.headers["X-Frame-Options"] = "DENY"
        # Limite les infos envoyees au cross-origin via Referer
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Coupe les permissions de capteurs sensibles cote client
        response.headers["Permissions-Policy"] = (
            "camera=(self), microphone=(), geolocation=(), payment=()"
        )
        return response


def _ensure_columns() -> None:
    """Idempotent ALTER TABLE for new columns added after initial deploy."""
    insp = inspect(engine)
    if "galas" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("galas")}
        if "live_results_visible" not in cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE galas ADD COLUMN live_results_visible BOOLEAN DEFAULT FALSE"
                    )
                )

    if "users" in insp.get_table_names():
        user_cols = {c["name"] for c in insp.get_columns("users")}
        if "matricule" not in user_cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN matricule VARCHAR(40) DEFAULT NULL"
                    )
                )

    if "students" in insp.get_table_names():
        student_cols = {c["name"] for c in insp.get_columns("students")}
        if "classe" not in student_cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE students ADD COLUMN classe VARCHAR(80) DEFAULT NULL"
                    )
                )
        if "gender" not in student_cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE students ADD COLUMN gender VARCHAR(1) DEFAULT NULL"
                    )
                )

    if "tickets" in insp.get_table_names():
        ticket_cols = {c["name"] for c in insp.get_columns("tickets")}
        if "max_scans" not in ticket_cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE tickets ADD COLUMN max_scans INTEGER DEFAULT 1"
                    )
                )
        if "scan_count" not in ticket_cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE tickets ADD COLUMN scan_count INTEGER DEFAULT 0"
                    )
                )
        if "attendees" not in ticket_cols:
            with engine.begin() as conn:
                # JSON works on SQLite, Postgres (JSON), MySQL 5.7+
                conn.execute(
                    text(
                        "ALTER TABLE tickets ADD COLUMN attendees JSON DEFAULT NULL"
                    )
                )


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_columns()
    # Avertir si la SECRET_KEY par defaut est utilisee en prod
    if settings.SECRET_KEY in (
        "dev-secret-change-me",
        "dev-secret-please-change-in-prod-32chars",
        "change-me-in-prod-openssl-rand-hex-32",
    ):
        logger.warning(
            "[SECURITY] SECRET_KEY est sur la valeur par defaut. "
            'Generez-en une via : python -c "import secrets; print(secrets.token_hex(32))" '
            "et definissez-la dans la variable d'environnement SECRET_KEY."
        )
    yield


app = FastAPI(
    title="IT Awards 2026 — Gala API",
    version="1.0.0",
    description="API du gala IT Awards : auth, billetterie, scan QR, vote des nominés.",
    lifespan=lifespan,
)

# Rate limiting (slowapi) — empeche brute force login, spam forgot-password, etc.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Headers HTTP de securite (X-Frame, X-Content-Type, Referrer-Policy, Permissions-Policy)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/nominees", exist_ok=True)
os.makedirs("uploads/souvenirs", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


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
app.include_router(souvenirs.router, prefix=api_v1_prefix)
