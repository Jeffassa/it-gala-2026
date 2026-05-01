from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TicketType(str, Enum):
    SOLO = "solo"
    DUO = "duo"
    GBONHI = "gbonhi"


class TicketStatus(str, Enum):
    SOLD = "sold"
    SCANNED = "scanned"
    CANCELLED = "cancelled"


class AttendeeStatus(str, Enum):
    ESOTERIC = "esoteric"
    REGULAR = "regular"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    gala_id: Mapped[int] = mapped_column(ForeignKey("galas.id", ondelete="CASCADE"), index=True)
    type: Mapped[TicketType] = mapped_column(String(20))
    attendee_status: Mapped[AttendeeStatus] = mapped_column(String(20), default=AttendeeStatus.REGULAR)
    status: Mapped[TicketStatus] = mapped_column(String(20), default=TicketStatus.SOLD)
    price: Mapped[float] = mapped_column(Float)

    buyer_full_name: Mapped[str] = mapped_column(String(120))
    buyer_email: Mapped[str] = mapped_column(String(190), index=True)
    buyer_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    partner_full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    group_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    sold_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    sold_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    scanned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    scanned_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
