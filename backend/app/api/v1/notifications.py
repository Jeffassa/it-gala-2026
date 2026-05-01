from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import BroadcastRequest, NotificationOut
from app.services.email import send_email

router = APIRouter(prefix="/notifications", tags=["notifications"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[NotificationOut])
def list_notifications(db: Session = Depends(get_db), limit: int = 100) -> list[NotificationOut]:
    rows = db.scalars(select(Notification).order_by(Notification.created_at.desc()).limit(limit)).all()
    return [NotificationOut.model_validate(r) for r in rows]


@router.post("/broadcast", response_model=dict)
def broadcast(payload: BroadcastRequest, db: Session = Depends(get_db)) -> dict:
    stmt = select(User).where(User.is_active.is_(True))
    if payload.role:
        stmt = stmt.where(User.role == payload.role)
    users = db.scalars(stmt).all()
    sent, failed = 0, 0
    for u in users:
        try:
            n = send_email(db, to=u.email, subject=payload.subject, body=payload.body, user_id=u.id)
            ok = ("sent" in repr(n.status)) or (n.error is None)
        except Exception:
            ok = False
        if ok:
            sent += 1
        else:
            failed += 1
    return {"recipients": len(users), "sent": sent, "failed": failed}
