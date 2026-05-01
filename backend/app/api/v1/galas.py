from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.gala import Gala
from app.schemas.gala import GalaCreate, GalaOut, GalaUpdate

router = APIRouter(prefix="/galas", tags=["galas"])


@router.get("", response_model=list[GalaOut])
def list_galas(db: Session = Depends(get_db)) -> list[GalaOut]:
    galas = db.scalars(select(Gala).order_by(Gala.edition_year.desc())).all()
    return [GalaOut.model_validate(g) for g in galas]


@router.get("/active", response_model=GalaOut | None)
def active_gala(db: Session = Depends(get_db)) -> GalaOut | None:
    g = db.scalar(select(Gala).where(Gala.is_active.is_(True)).order_by(Gala.edition_year.desc()))
    return GalaOut.model_validate(g) if g else None


@router.get("/{gala_id}", response_model=GalaOut)
def get_gala(gala_id: int, db: Session = Depends(get_db)) -> GalaOut:
    g = db.get(Gala, gala_id)
    if g is None:
        raise HTTPException(status_code=404, detail="Gala introuvable")
    return GalaOut.model_validate(g)


@router.post("", response_model=GalaOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_gala(payload: GalaCreate, db: Session = Depends(get_db)) -> GalaOut:
    g = Gala(**payload.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return GalaOut.model_validate(g)


@router.patch("/{gala_id}", response_model=GalaOut, dependencies=[Depends(require_admin)])
def update_gala(gala_id: int, payload: GalaUpdate, db: Session = Depends(get_db)) -> GalaOut:
    g = db.get(Gala, gala_id)
    if g is None:
        raise HTTPException(status_code=404, detail="Gala introuvable")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(g, k, v)
    db.commit()
    db.refresh(g)
    return GalaOut.model_validate(g)


@router.delete("/{gala_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_gala(gala_id: int, db: Session = Depends(get_db)) -> None:
    g = db.get(Gala, gala_id)
    if g is None:
        raise HTTPException(status_code=404, detail="Gala introuvable")
    db.delete(g)
    db.commit()
