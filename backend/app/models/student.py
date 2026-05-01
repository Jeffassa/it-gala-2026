from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Student(Base):
    """ESATIC student directory — imported from Excel files class by class."""

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    matricule: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160), index=True)
    email: Mapped[str | None] = mapped_column(String(190), index=True, nullable=True)
    promotion: Mapped[str] = mapped_column(String(80), index=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
