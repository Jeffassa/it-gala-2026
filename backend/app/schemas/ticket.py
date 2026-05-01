from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.ticket import AttendeeStatus, TicketStatus, TicketType


class TicketCreate(BaseModel):
    gala_id: int
    type: TicketType
    attendee_status: AttendeeStatus = AttendeeStatus.REGULAR
    price: float
    buyer_full_name: str
    buyer_email: EmailStr
    buyer_phone: str | None = None
    partner_full_name: str | None = None  # optional even for duo
    group_size: int | None = None


class TicketOut(BaseModel):
    id: int
    code: str
    gala_id: int
    type: TicketType
    attendee_status: AttendeeStatus
    status: TicketStatus
    price: float
    buyer_full_name: str
    buyer_email: EmailStr
    buyer_phone: str | None = None
    partner_full_name: str | None = None
    group_size: int | None = None
    sold_by_id: int | None = None
    sold_at: datetime
    scanned_at: datetime | None = None

    class Config:
        from_attributes = True


class ScanResult(BaseModel):
    ok: bool
    message: str
    ticket: TicketOut | None = None
    already_scanned: bool = False
