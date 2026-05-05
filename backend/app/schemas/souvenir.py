from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SouvenirBase(BaseModel):
    gala_id: int
    title: str
    image_url: str | None = None
    order: int = 0


class SouvenirCreate(SouvenirBase):
    pass


class SouvenirUpdate(BaseModel):
    title: str | None = None
    image_url: str | None = None
    order: int | None = None


class SouvenirOut(SouvenirBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
