from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Gala(Base):
    __tablename__ = "galas"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    edition_year: Mapped[int] = mapped_column(Integer)
    theme: Mapped[str] = mapped_column(String(255))
    event_date: Mapped[datetime] = mapped_column(DateTime)
    location: Mapped[str] = mapped_column(String(255))
    dress_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    program: Mapped[str | None] = mapped_column(Text, nullable=True)
    poster_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tiktok_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    telegram_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    voting_open: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
