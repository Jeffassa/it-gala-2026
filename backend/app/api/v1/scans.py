from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_controller
from app.models.scan import Scan
from app.models.ticket import Ticket, TicketStatus, TicketType
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
        return ScanResult(
            ok=False,
            message="Ticket annulé",
            ticket=TicketOut.model_validate(ticket),
        )
    if ticket.status == TicketStatus.SCANNED:
        return ScanResult(
            ok=False,
            message="Quota de scans atteint pour ce ticket",
            ticket=TicketOut.model_validate(ticket),
            already_scanned=True,
        )

    # Ensure defaults for old records
    if ticket.scan_count is None:
        ticket.scan_count = 0
    if ticket.max_scans is None:
        ticket.max_scans = 1

    ticket.scan_count += 1
    if ticket.scan_count >= ticket.max_scans:
        ticket.status = TicketStatus.SCANNED

    ticket.scanned_at = datetime.utcnow()
    ticket.scanned_by_id = current.id
    db.add(Scan(ticket_id=ticket.id, scanned_by_id=current.id))
    db.commit()
    db.refresh(ticket)

    if ticket.type == TicketType.SOLO:
        message = "Ticket validé ✓"
    else:
        message = f"Ticket validé ✓ ({ticket.scan_count}/{ticket.max_scans})"

    return ScanResult(
        ok=True, message=message, ticket=TicketOut.model_validate(ticket)
    )


@router.get("/stats")
def scan_stats(
    db: Session = Depends(get_db),
    current: User = Depends(require_controller),
) -> dict:
    # Get active gala ID to filter stats
    from app.models.gala import Gala
    active_gala_id = db.scalar(select(Gala.id).where(Gala.is_active.is_(True)))
    
    if not active_gala_id:
        return {
            "total_tickets": 0,
            "scanned_tickets": 0,
            "remaining": 0,
            "my_scans": 0,
            "by_type": {"solo": 0, "duo": 0, "gbonhi": 0},
        }

    total = db.scalar(select(func.count(Ticket.id)).where(Ticket.gala_id == active_gala_id)) or 0
    total_capacity = (
        db.scalar(select(func.sum(Ticket.max_scans)).where(Ticket.gala_id == active_gala_id))
        or 0
    )
    scanned = (
        db.scalar(select(func.sum(Ticket.scan_count)).where(Ticket.gala_id == active_gala_id))
        or 0
    )
    remaining = max(0, int(total_capacity) - int(scanned))

    my_scans = (
        db.scalar(
            select(func.count(Scan.id)).where(Scan.scanned_by_id == current.id)
        )
        or 0
    )

    # Stats par type (nombre de tickets émis pour le gala actif)
    solo = db.scalar(select(func.count(Ticket.id)).where(Ticket.gala_id == active_gala_id, Ticket.type == TicketType.SOLO)) or 0
    duo = db.scalar(select(func.count(Ticket.id)).where(Ticket.gala_id == active_gala_id, Ticket.type == TicketType.DUO)) or 0
    gbonhi = db.scalar(select(func.count(Ticket.id)).where(Ticket.gala_id == active_gala_id, Ticket.type == TicketType.GBONHI)) or 0

    return {
        "total_tickets": int(total),
        "scanned_tickets": int(scanned),
        "remaining": remaining,
        "my_scans": int(my_scans),
        "by_type": {
            "solo": int(solo),
            "duo": int(duo),
            "gbonhi": int(gbonhi),
        },
    }


@router.get("/recent", response_model=list[TicketOut])
def recent_scans(
    db: Session = Depends(get_db),
    current: User = Depends(require_controller),
    limit: int = 20,
) -> list[TicketOut]:
    # Get active gala ID
    from app.models.gala import Gala
    active_gala_id = db.scalar(select(Gala.id).where(Gala.is_active.is_(True)))
    if not active_gala_id:
        return []

    rows = db.scalars(
        select(Ticket)
        .where(Ticket.gala_id == active_gala_id, Ticket.scan_count > 0)
        .order_by(Ticket.scanned_at.desc())
        .limit(limit)
    ).all()
    return [TicketOut.model_validate(t) for t in rows]
