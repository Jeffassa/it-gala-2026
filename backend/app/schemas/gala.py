from datetime import datetime

from pydantic import BaseModel


class GalaBase(BaseModel):
    name: str
    edition_year: int
    theme: str
    event_date: datetime
    location: str
    dress_code: str | None = None
    program: str | None = None
    poster_url: str | None = None
    video_url: str | None = None
    tiktok_url: str | None = None
    telegram_url: str | None = None


class GalaCreate(GalaBase):
    pass


class GalaUpdate(BaseModel):
    name: str | None = None
    edition_year: int | None = None
    theme: str | None = None
    event_date: datetime | None = None
    location: str | None = None
    dress_code: str | None = None
    program: str | None = None
    poster_url: str | None = None
    video_url: str | None = None
    tiktok_url: str | None = None
    telegram_url: str | None = None
    is_active: bool | None = None
    voting_open: bool | None = None


class GalaOut(GalaBase):
    id: int
    is_active: bool
    voting_open: bool
    created_at: datetime

    class Config:
        from_attributes = True
