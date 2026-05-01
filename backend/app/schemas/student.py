import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


MATRICULE_RE = re.compile(r"^\d{2}-ESATIC\d{4}[A-Z]{2}$")


class StudentBase(BaseModel):
    matricule: str
    full_name: str
    email: EmailStr | None = None
    promotion: str
    phone: str | None = None

    @field_validator("matricule")
    @classmethod
    def validate_matricule(cls, v: str) -> str:
        v = v.strip().upper()
        if not MATRICULE_RE.match(v):
            raise ValueError(
                "Matricule invalide. Format attendu : AA-ESATIC#### + 2 lettres (ex : 22-ESATIC0273DN)."
            )
        return v


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    promotion: str | None = None
    phone: str | None = None


class StudentOut(StudentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StudentImportResult(BaseModel):
    created: int
    updated: int
    skipped: int
    errors: list[str]
    total_rows: int
