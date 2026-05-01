from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.PARTICIPANT
    school_promotion: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    school_promotion: str | None = None
    is_active: bool | None = None
    password: str | None = None


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    school_promotion: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithSpend(UserOut):
    total_spent: float = 0.0
    tickets_count: int = 0
