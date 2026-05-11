from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Verifie l'integrite du token ET la coherence avec la DB.

    Etapes :
      1. decode_token() leve si la signature est invalide, le token expire,
         l'algorithme suspect, l'issuer/audience faux, ou un claim manque.
      2. On recupere l'utilisateur en DB depuis le claim "sub".
      3. Le compte doit exister et etre actif.
      4. Le claim "role" du token doit matcher le role en DB : ainsi un
         token devenu obsolete (ex: admin retrograde) est rejete, meme
         si la signature est intacte.
    """
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        token_role = payload.get("role")
    except (JWTError, ValueError, TypeError):
        raise cred_exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise cred_exc

    # Defense en profondeur : on compare le role grave dans le token signe
    # et le role courant en DB. Si l'admin a degrade ce compte depuis
    # l'emission du token, le token devient invalide automatiquement.
    db_role = user.role.value if hasattr(user.role, "value") else user.role
    if token_role != db_role:
        raise cred_exc

    return user


def require_roles(*roles: UserRole):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès refusé — rôle requis: {', '.join(r.value for r in roles)}",
            )
        return user

    return checker


require_admin = require_roles(UserRole.SUPER_ADMIN)
require_cashier = require_roles(UserRole.SUPER_ADMIN, UserRole.CASHIER)
require_controller = require_roles(UserRole.SUPER_ADMIN, UserRole.CONTROLLER)
require_participant = require_roles(
    UserRole.SUPER_ADMIN,
    UserRole.PARTICIPANT,
    UserRole.CASHIER,
    UserRole.CONTROLLER,
)
