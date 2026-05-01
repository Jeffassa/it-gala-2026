from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.nominee import Nominee
from app.models.vote import Vote
from app.schemas.nominee import NomineeCreate, NomineeOut, NomineeUpdate

router = APIRouter(prefix="/nominees", tags=["nominees"])


@router.get("", response_model=list[NomineeOut])
def list_nominees(
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
) -> list[NomineeOut]:
    stmt = select(Nominee)
    if category_id is not None:
        stmt = stmt.where(Nominee.category_id == category_id)
    stmt = stmt.order_by(Nominee.id)
    nominees = db.scalars(stmt).all()

    vote_counts = dict(
        db.execute(select(Vote.nominee_id, func.count(Vote.id)).group_by(Vote.nominee_id)).all()
    )
    return [
        NomineeOut(
            id=n.id,
            category_id=n.category_id,
            name=n.name,
            school_promotion=n.school_promotion,
            photo_url=n.photo_url,
            description=n.description,
            votes_count=int(vote_counts.get(n.id, 0)),
        )
        for n in nominees
    ]


@router.post("", response_model=NomineeOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_nominee(payload: NomineeCreate, db: Session = Depends(get_db)) -> NomineeOut:
    n = Nominee(**payload.model_dump())
    db.add(n)
    db.commit()
    db.refresh(n)
    return NomineeOut(
        id=n.id, category_id=n.category_id, name=n.name,
        school_promotion=n.school_promotion, photo_url=n.photo_url,
        description=n.description, votes_count=0,
    )


@router.patch("/{nominee_id}", response_model=NomineeOut, dependencies=[Depends(require_admin)])
def update_nominee(nominee_id: int, payload: NomineeUpdate, db: Session = Depends(get_db)) -> NomineeOut:
    n = db.get(Nominee, nominee_id)
    if n is None:
        raise HTTPException(status_code=404, detail="Nominé introuvable")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(n, k, v)
    db.commit()
    db.refresh(n)
    votes = db.scalar(select(func.count(Vote.id)).where(Vote.nominee_id == n.id)) or 0
    return NomineeOut(
        id=n.id, category_id=n.category_id, name=n.name,
        school_promotion=n.school_promotion, photo_url=n.photo_url,
        description=n.description, votes_count=int(votes),
    )


@router.delete("/{nominee_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_nominee(nominee_id: int, db: Session = Depends(get_db)) -> None:
    n = db.get(Nominee, nominee_id)
    if n is None:
        raise HTTPException(status_code=404, detail="Nominé introuvable")
    db.delete(n)
    db.commit()
