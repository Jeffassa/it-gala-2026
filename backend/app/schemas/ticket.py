from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.models.ticket import AttendeeStatus, TicketStatus, TicketType


class Attendee(BaseModel):
    full_name: str
    email: EmailStr | None = None
    phone: str | None = None


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
    attendees: list[Attendee] = []


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
    max_scans: int = 1
    scan_count: int = 0
    attendees: list[Attendee] = []

    class Config:
        from_attributes = True

    @field_validator("attendees", mode="before")
    @classmethod
    def validate_attendees(cls, v):
        return v or []

    @field_validator("max_scans", mode="before")
    @classmethod
    def validate_max_scans(cls, v):
        return v if v is not None else 1

    @field_validator("scan_count", mode="before")
    @classmethod
    def validate_scan_count(cls, v):
        return v if v is not None else 0


class ScanResult(BaseModel):
    ok: bool
    message: str
    ticket: TicketOut | None = None
    already_scanned: bool = False
