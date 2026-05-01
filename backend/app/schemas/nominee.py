from pydantic import BaseModel


class NomineeBase(BaseModel):
    category_id: int
    name: str
    school_promotion: str | None = None
    photo_url: str | None = None
    description: str | None = None
    biography: str | None = None
    achievements: str | None = None
    contact_email: str | None = None


class NomineeCreate(NomineeBase):
    pass


class NomineeUpdate(BaseModel):
    name: str | None = None
    school_promotion: str | None = None
    photo_url: str | None = None
    description: str | None = None
    biography: str | None = None
    achievements: str | None = None
    contact_email: str | None = None


class NomineeOut(NomineeBase):
    id: int
    votes_count: int = 0

    class Config:
        from_attributes = True
