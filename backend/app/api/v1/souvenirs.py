from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.uploads import save_image_upload
from app.models.souvenir import Souvenir
from app.schemas.souvenir import SouvenirCreate, SouvenirOut, SouvenirUpdate

router = APIRouter(prefix="/souvenirs", tags=["souvenirs"])


@router.get("", response_model=list[SouvenirOut])
def list_souvenirs(
    gala_id: int | None = Query(None),
    db: Session = Depends(get_db),
) -> list[SouvenirOut]:
    stmt = select(Souvenir)
    if gala_id is not None:
        stmt = stmt.where(Souvenir.gala_id == gala_id)
    stmt = stmt.order_by(Souvenir.order, Souvenir.id)
    return list(db.scalars(stmt).all())


@router.post(
    "",
    response_model=SouvenirOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_souvenir(
    payload: SouvenirCreate, db: Session = Depends(get_db)
) -> Souvenir:
    s = Souvenir(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch(
    "/{souvenir_id}",
    response_model=SouvenirOut,
    dependencies=[Depends(require_admin)],
)
def update_souvenir(
    souvenir_id: int, payload: SouvenirUpdate, db: Session = Depends(get_db)
) -> Souvenir:
    s = db.get(Souvenir, souvenir_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Souvenir introuvable")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete(
    "/{souvenir_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_souvenir(souvenir_id: int, db: Session = Depends(get_db)) -> None:
    s = db.get(Souvenir, souvenir_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Souvenir introuvable")
    db.delete(s)
    db.commit()


@router.post(
    "/{souvenir_id}/photo",
    response_model=SouvenirOut,
    dependencies=[Depends(require_admin)],
)
def upload_souvenir_photo(
    souvenir_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Souvenir:
    s = db.get(Souvenir, souvenir_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Souvenir introuvable")

    _, filename = save_image_upload(
        file, target_dir="uploads/souvenirs", base_name=s.id
    )
    s.image_url = f"/uploads/souvenirs/{filename}"
    db.commit()
    db.refresh(s)
    return s
