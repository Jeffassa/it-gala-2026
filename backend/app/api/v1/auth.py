import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.password_reset import PasswordResetToken
from app.models.user import User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)
from app.services.email import send_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email déjà utilisé")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.PARTICIPANT,
        school_promotion=payload.school_promotion,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.role if isinstance(user.role, str) else user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Compte désactivé")
    token = create_access_token(user.id, user.role if isinstance(user.role, str) else user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current)


# ─────────────────────── Forgot / Reset password ───────────────────────


def _build_reset_email_html(reset_url: str, user_name: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0E0808;font-family:Arial, Helvetica, sans-serif;color:#FFFFFF;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0E0808;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:linear-gradient(180deg,#1A1010 0%,#0E0808 100%);border:1px solid #3A2828;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <table role="presentation" width="100%"><tr>
            <td style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#FFFFFF;letter-spacing:0.02em;">IT <span style="color:#F0A50C;">Gala</span></td>
            <td style="text-align:right;font-size:11px;color:#F0A50C;letter-spacing:0.2em;text-transform:uppercase;">Sécurité</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 32px 24px 32px;">
          <p style="margin:18px 0 6px 0;font-size:11px;letter-spacing:0.25em;color:#F0A50C;text-transform:uppercase;">Réinitialisation du mot de passe</p>
          <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:28px;line-height:1.15;color:#FFFFFF;">Bonjour {user_name},</h1>
          <p style="margin:0 0 24px 0;color:#C9B8B8;font-size:14px;line-height:1.6;">Vous avez demandé la réinitialisation de votre mot de passe pour votre compte IT Gala. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td>
            <a href="{reset_url}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#F0A50C 0%,#FBC23A 100%);color:#0E0808;font-size:15px;font-weight:bold;text-decoration:none;border-radius:12px;letter-spacing:0.04em;">Réinitialiser mon mot de passe</a>
          </td></tr></table>
          <p style="margin:24px 0 0 0;color:#A89A9A;font-size:12px;line-height:1.6;">
            Ce lien expire dans <strong style="color:#FFFFFF;">30 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
          </p>
          <p style="margin:16px 0 0 0;color:#6b6b76;font-size:11px;word-break:break-all;">{reset_url}</p>
        </td></tr>
        <tr><td style="background:#1A1010;border-top:1px solid #3A2828;padding:18px 32px;text-align:center;">
          <p style="margin:0;color:#8A7575;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">© 2026 IT Gala — Une nuit pour célébrer la tech</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def _build_reset_email_text(reset_url: str, user_name: str) -> str:
    return (
        f"Bonjour {user_name},\n\n"
        f"Vous avez demandé la réinitialisation de votre mot de passe.\n"
        f"Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :\n\n"
        f"{reset_url}\n\n"
        f"Ce lien expire dans 30 minutes.\n"
        f"Si vous n'avez pas fait cette demande, ignorez cet email.\n\n"
        f"L'équipe IT Gala\n"
    )


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> dict:
    """Send a password reset email if the account exists.

    Always returns 200 with a generic message to prevent email enumeration.
    """
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is not None and user.is_active:
        # Invalidate any previous unused tokens for this user
        prev_tokens = db.scalars(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used.is_(False),
            )
        ).all()
        for t in prev_tokens:
            t.used = True

        token_str = secrets.token_urlsafe(48)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token_str,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        db.add(reset_token)
        db.commit()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token_str}"
        html = _build_reset_email_html(reset_url, user.full_name)
        text = _build_reset_email_text(reset_url, user.full_name)

        try:
            send_email(
                db,
                to=user.email,
                subject="Réinitialisation de votre mot de passe — IT Gala",
                body=text,
                html=html,
                user_id=user.id,
            )
        except Exception:
            pass  # Failure logged in notifications table by send_email

    return {"message": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> dict:
    """Reset the user's password using a valid token."""
    reset_token = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token == payload.token)
    )
    if reset_token is None or reset_token.used:
        raise HTTPException(status_code=400, detail="Lien invalide ou déjà utilisé")

    if reset_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Ce lien a expiré. Veuillez refaire une demande.")

    user = db.get(User, reset_token.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Utilisateur introuvable")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères")

    user.hashed_password = hash_password(payload.new_password)
    reset_token.used = True
    db.commit()

    return {"message": "Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter."}
