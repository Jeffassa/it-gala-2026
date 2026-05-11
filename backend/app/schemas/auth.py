import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole

# Matricule ESATIC : YY-ESATICNNNNLL
#   YY    = 2 chiffres (annee, ex: 26)
#   ESATIC = sigle fixe
#   NNNN  = 4 chiffres (numero d'ordre)
#   LL    = 2 lettres MAJUSCULES
# Exemple : 26-ESATIC0001AB
MATRICULE_REGEX = re.compile(r"^\d{2}-ESATIC\d{4}[A-Z]{2}$")
MATRICULE_HELP = (
    "Format attendu : YY-ESATICNNNNLL "
    "(ex : 26-ESATIC0001AB)."
)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    matricule: str = Field(min_length=15, max_length=15)
    school_promotion: str | None = None

    @field_validator("matricule")
    @classmethod
    def validate_matricule(cls, v: str) -> str:
        v = v.strip().upper()
        if not MATRICULE_REGEX.match(v):
            raise ValueError(MATRICULE_HELP)
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    school_promotion: str | None = None
    matricule: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


TokenResponse.model_rebuild()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
