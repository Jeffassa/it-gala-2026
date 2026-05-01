from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), index=True)
    scanned_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    scanned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
