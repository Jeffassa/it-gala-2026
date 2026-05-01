from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.ticket import Ticket
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserOut, UserUpdate, UserWithSpend

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[UserWithSpend])
def list_users(db: Session = Depends(get_db)) -> list[UserWithSpend]:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()

    spend_rows = db.execute(
        select(
            Ticket.buyer_email,
            func.sum(Ticket.price).label("total"),
            func.count(Ticket.id).label("cnt"),
        ).group_by(Ticket.buyer_email)
    ).all()
    spend_map = {row.buyer_email: (float(row.total or 0), int(row.cnt or 0)) for row in spend_rows}

    out: list[UserWithSpend] = []
    for u in users:
        total, cnt = spend_map.get(u.email, (0.0, 0))
        out.append(UserWithSpend(**UserOut.model_validate(u).model_dump(), total_spent=total, tickets_count=cnt))
    return out


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        school_promotion=payload.school_promotion,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> UserOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        user.hashed_password = hash_password(data.pop("password"))
    for k, v in data.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/{user_id}/suspend", response_model=UserOut)
def suspend_user(user_id: int, db: Session = Depends(get_db)) -> UserOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/{user_id}/activate", response_model=UserOut)
def activate_user(user_id: int, db: Session = Depends(get_db)) -> UserOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)) -> None:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Impossible de supprimer un super admin")
    db.delete(user)
    db.commit()
