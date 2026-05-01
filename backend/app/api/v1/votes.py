from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.gala import Gala
from app.models.nominee import Nominee
from app.models.user import User
from app.models.vote import Vote
from app.schemas.vote import MyVotesItem, VoteCreate, VoteOut

router = APIRouter(prefix="/votes", tags=["votes"])


@router.post("", response_model=VoteOut, status_code=status.HTTP_201_CREATED)
def cast_vote(
    payload: VoteCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> VoteOut:
    nominee = db.get(Nominee, payload.nominee_id)
    if nominee is None:
        raise HTTPException(status_code=404, detail="Nominé introuvable")

    active_gala = db.scalar(select(Gala).where(Gala.is_active.is_(True)))
    if active_gala is not None and not active_gala.voting_open:
        raise HTTPException(status_code=403, detail="Les votes sont fermés")

    existing = db.scalar(
        select(Vote).where(Vote.user_id == current.id, Vote.category_id == nominee.category_id)
    )
    if existing is not None:
        existing.nominee_id = nominee.id
        db.commit()
        db.refresh(existing)
        return VoteOut.model_validate(existing)

    vote = Vote(user_id=current.id, category_id=nominee.category_id, nominee_id=nominee.id)
    db.add(vote)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Vote déjà enregistré pour cette catégorie")
    db.refresh(vote)
    return VoteOut.model_validate(vote)


@router.get("/me", response_model=list[MyVotesItem])
def my_votes(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[MyVotesItem]:
    rows = db.scalars(select(Vote).where(Vote.user_id == current.id)).all()
    return [MyVotesItem(category_id=r.category_id, nominee_id=r.nominee_id) for r in rows]
