import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_cashier
from app.models.gala import Gala
from app.models.ticket import Ticket, TicketStatus, TicketType
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketOut
from app.services.ticket_email import send_ticket_email

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _gen_code() -> str:
    return "GIA-" + secrets.token_hex(6).upper()


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_cashier),
) -> TicketOut:
    code = _gen_code()
    while db.scalar(select(Ticket).where(Ticket.code == code)):
        code = _gen_code()
    max_scans = 1
    if payload.type == TicketType.DUO:
        max_scans = 2
    elif payload.type == TicketType.GBONHI:
        max_scans = 5

    ticket = Ticket(
        code=code,
        gala_id=payload.gala_id,
        type=payload.type,
        attendee_status=payload.attendee_status,
        price=payload.price,
        buyer_full_name=payload.buyer_full_name,
        buyer_email=payload.buyer_email,
        buyer_phone=payload.buyer_phone,
        partner_full_name=payload.partner_full_name,
        group_size=payload.group_size,
        sold_by_id=current.id,
        max_scans=max_scans,
        attendees=[a.model_dump() for a in payload.attendees],
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Send the ticket by email (with QR inline) — non-blocking on failure
    gala = db.get(Gala, ticket.gala_id)
    if gala is not None:
        if payload.attendees:
            for attendee in payload.attendees:
                if attendee.email:
                    send_ticket_email(
                        db,
                        ticket,
                        gala,
                        recipient_name=attendee.full_name,
                        recipient_email=attendee.email,
                    )
        else:
            send_ticket_email(db, ticket, gala)

    return TicketOut.model_validate(ticket)


@router.get("/stats")
def ticket_stats(
    db: Session = Depends(get_db),
    current: User = Depends(require_cashier),
) -> dict:
    from sqlalchemy import func
    from app.models.ticket import TicketType

    solo = (
        db.scalar(
            select(func.count(Ticket.id)).where(Ticket.type == TicketType.SOLO)
        )
        or 0
    )
    duo = (
        db.scalar(
            select(func.count(Ticket.id)).where(Ticket.type == TicketType.DUO)
        )
        or 0
    )
    gbonhi = (
        db.scalar(
            select(func.count(Ticket.id)).where(
                Ticket.type == TicketType.GBONHI
            )
        )
        or 0
    )
    return {
        "solo": int(solo),
        "duo": int(duo),
        "gbonhi": int(gbonhi),
    }


@router.get("", response_model=list[TicketOut])
def list_tickets(
    db: Session = Depends(get_db),
    current: User = Depends(require_cashier),
    q: str | None = Query(None),
    gala_id: int | None = Query(None),
    status_filter: TicketStatus | None = Query(None, alias="status"),
    limit: int = 100,
) -> list[TicketOut]:
    stmt = select(Ticket).order_by(Ticket.sold_at.desc()).limit(limit)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Ticket.buyer_full_name.ilike(like),
                Ticket.buyer_email.ilike(like),
                Ticket.code.ilike(like),
                Ticket.partner_full_name.ilike(like),
            )
        )
    if gala_id is not None:
        stmt = stmt.where(Ticket.gala_id == gala_id)
    if status_filter is not None:
        stmt = stmt.where(Ticket.status == status_filter)
    return [TicketOut.model_validate(t) for t in db.scalars(stmt).all()]


@router.get("/{code}", response_model=TicketOut)
def get_ticket_by_code(
    code: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> TicketOut:
    t = db.scalar(select(Ticket).where(Ticket.code == code))
    if t is None:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    return TicketOut.model_validate(t)
