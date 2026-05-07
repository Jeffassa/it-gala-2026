from datetime import datetime
from sqlalchemy import DateTime, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Souvenir(Base):
    __tablename__ = "souvenirs"

    id: Mapped[int] = mapped_column(primary_key=True)
    gala_id: Mapped[int] = mapped_column(Integer, ForeignKey("galas.id"))
    title: Mapped[str] = mapped_column(String(160))
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
