"""Audit endpoints — exhaustive scan log for litigation handling."""
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.scan import Scan
from app.models.ticket import Ticket
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["audit"], dependencies=[Depends(require_admin)])


class ScanLogEntry(BaseModel):
    id: int
    scanned_at: datetime
    ticket_code: str
    ticket_buyer: str
    ticket_type: str
    controller_name: str
    controller_email: str

    class Config:
        from_attributes = True


@router.get("/scans", response_model=list[ScanLogEntry])
def scan_log(
    db: Session = Depends(get_db),
    limit: int = Query(200, le=1000),
    controller_id: int | None = Query(None),
) -> list[ScanLogEntry]:
    stmt = (
        select(Scan, Ticket, User)
        .join(Ticket, Ticket.id == Scan.ticket_id)
        .join(User, User.id == Scan.scanned_by_id)
        .order_by(Scan.scanned_at.desc())
        .limit(limit)
    )
    if controller_id is not None:
        stmt = stmt.where(Scan.scanned_by_id == controller_id)

    rows = db.execute(stmt).all()
    return [
        ScanLogEntry(
            id=scan.id,
            scanned_at=scan.scanned_at,
            ticket_code=ticket.code,
            ticket_buyer=ticket.buyer_full_name,
            ticket_type=str(ticket.type),
            controller_name=user.full_name,
            controller_email=user.email,
        )
        for (scan, ticket, user) in rows
    ]
