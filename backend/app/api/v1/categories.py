from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.category import Category
from app.models.nominee import Nominee
from app.models.vote import Vote
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate, CategoryWithStats

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryWithStats])
def list_categories(
    gala_id: int | None = Query(None),
    db: Session = Depends(get_db),
) -> list[CategoryWithStats]:
    stmt = select(Category).order_by(Category.order_index, Category.id)
    if gala_id is not None:
        stmt = stmt.where(Category.gala_id == gala_id)
    cats = db.scalars(stmt).all()

    nom_counts = dict(
        db.execute(select(Nominee.category_id, func.count(Nominee.id)).group_by(Nominee.category_id)).all()
    )
    vote_counts = dict(
        db.execute(select(Vote.category_id, func.count(Vote.id)).group_by(Vote.category_id)).all()
    )

    return [
        CategoryWithStats(
            **CategoryOut.model_validate(c).model_dump(),
            total_votes=int(vote_counts.get(c.id, 0)),
            nominees_count=int(nom_counts.get(c.id, 0)),
        )
        for c in cats
    ]


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> CategoryOut:
    c = Category(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return CategoryOut.model_validate(c)


@router.patch("/{cat_id}", response_model=CategoryOut, dependencies=[Depends(require_admin)])
def update_category(cat_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)) -> CategoryOut:
    c = db.get(Category, cat_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return CategoryOut.model_validate(c)


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_category(cat_id: int, db: Session = Depends(get_db)) -> None:
    c = db.get(Category, cat_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    db.delete(c)
    db.commit()
