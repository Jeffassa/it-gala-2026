from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_controller
from app.models.scan import Scan
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.schemas.ticket import ScanResult, TicketOut

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("/{code}", response_model=ScanResult)
def scan_ticket(
    code: str,
    db: Session = Depends(get_db),
    current: User = Depends(require_controller),
) -> ScanResult:
    ticket = db.scalar(select(Ticket).where(Ticket.code == code))
    if ticket is None:
        return ScanResult(ok=False, message="Ticket inconnu")
    if ticket.status == TicketStatus.CANCELLED:
        return ScanResult(ok=False, message="Ticket annulé", ticket=TicketOut.model_validate(ticket))
    if ticket.status == TicketStatus.SCANNED:
        return ScanResult(
            ok=False,
            message=f"Ticket déjà scanné le {ticket.scanned_at:%d/%m/%Y %H:%M}",
            ticket=TicketOut.model_validate(ticket),
            already_scanned=True,
        )
    ticket.status = TicketStatus.SCANNED
    ticket.scanned_at = datetime.utcnow()
    ticket.scanned_by_id = current.id
    db.add(Scan(ticket_id=ticket.id, scanned_by_id=current.id))
    db.commit()
    db.refresh(ticket)
    return ScanResult(ok=True, message="Ticket validé ✓", ticket=TicketOut.model_validate(ticket))


@router.get("/stats")
def scan_stats(
    db: Session = Depends(get_db),
    current: User = Depends(require_controller),
) -> dict:
    total = db.scalar(select(func.count(Ticket.id))) or 0
    scanned = db.scalar(select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.SCANNED)) or 0
    my_scans = db.scalar(select(func.count(Scan.id)).where(Scan.scanned_by_id == current.id)) or 0
    return {
        "total_tickets": int(total),
        "scanned_tickets": int(scanned),
        "remaining": int(total) - int(scanned),
        "my_scans": int(my_scans),
    }


@router.get("/recent", response_model=list[TicketOut])
def recent_scans(
    db: Session = Depends(get_db),
    current: User = Depends(require_controller),
    limit: int = 20,
) -> list[TicketOut]:
    rows = db.scalars(
        select(Ticket)
        .where(Ticket.status == TicketStatus.SCANNED)
        .order_by(Ticket.scanned_at.desc())
        .limit(limit)
    ).all()
    return [TicketOut.model_validate(t) for t in rows]
