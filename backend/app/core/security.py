from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(
    subject: str | int, role: str, extra: dict[str, Any] | None = None
) -> str:
    """Cree un JWT signe HMAC avec SECRET_KEY.

    Claims emis :
      - sub : ID utilisateur
      - role : role en DB au moment de l'emission (cross-checke a chaque requete)
      - iat : date d'emission (UTC)
      - exp : expiration
      - iss : emetteur (ex : "it-gala-api")
      - aud : audience attendue (ex : "it-gala-app")
    Toute modification d'un seul de ces champs invalide la signature
    -> decode_token leve JWTError.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": now,
        "exp": expire,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(
        payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )


# Options EXPLICITES de verification — defense en profondeur :
# meme si la lib change ses defauts un jour, on garde un comportement strict.
_JWT_DECODE_OPTIONS = {
    "verify_signature": True,    # rejette toute alteration de payload/header
    "verify_aud": True,          # le claim "aud" doit matcher
    "verify_iss": True,          # le claim "iss" doit matcher
    "verify_exp": True,          # le claim "exp" doit etre dans le futur
    "verify_iat": True,          # le claim "iat" doit etre coherent
    "require_sub": True,         # le claim "sub" doit etre present
    "require_exp": True,
    "require_iat": True,
}


def decode_token(token: str) -> dict[str, Any]:
    """Decode et VERIFIE un JWT.

    Leve jose.JWTError si :
      - la signature ne correspond pas (token modifie / signe avec mauvaise cle)
      - l'algorithme n'est pas dans la liste autorisee (anti alg-confusion)
      - le token est expire
      - l'issuer ou l'audience ne correspondent pas
      - un claim obligatoire (sub/exp/iat) manque
    """
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],  # whitelist stricte (anti alg=none)
        audience=settings.JWT_AUDIENCE,
        issuer=settings.JWT_ISSUER,
        options=_JWT_DECODE_OPTIONS,
    )
