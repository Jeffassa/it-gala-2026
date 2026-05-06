import os
import shutil
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
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


@router.post("", response_model=SouvenirOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_souvenir(payload: SouvenirCreate, db: Session = Depends(get_db)) -> Souvenir:
    s = Souvenir(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/{souvenir_id}", response_model=SouvenirOut, dependencies=[Depends(require_admin)])
def update_souvenir(souvenir_id: int, payload: SouvenirUpdate, db: Session = Depends(get_db)) -> Souvenir:
    s = db.get(Souvenir, souvenir_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Souvenir introuvable")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{souvenir_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_souvenir(souvenir_id: int, db: Session = Depends(get_db)) -> None:
    s = db.get(Souvenir, souvenir_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Souvenir introuvable")
    db.delete(s)
    db.commit()


@router.post("/{souvenir_id}/photo", response_model=SouvenirOut, dependencies=[Depends(require_admin)])
async def upload_souvenir_photo(
    souvenir_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Souvenir:
    s = db.get(Souvenir, souvenir_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Souvenir introuvable")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Fichier manquant")

    # 1. Validation de la taille (max 5 Mo)
    MAX_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5 Mo)")

    # 2. Validation de l'extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        raise HTTPException(status_code=400, detail="Format d'image non supporté (.jpg, .png, .webp uniquement)")

    # 3. Validation du contenu réel via Pillow
    try:
        img = Image.open(BytesIO(content))
        img.verify()
    except (UnidentifiedImageError, Exception):
        raise HTTPException(status_code=400, detail="Fichier corrompu ou n'étant pas une image valide")

    # Ensure upload directory exists
    upload_dir = os.path.join("uploads", "souvenirs")
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{s.id}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as buffer:
        buffer.write(content)

    s.image_url = f"/uploads/souvenirs/{filename}"
    db.commit()
    db.refresh(s)
    return s
