from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.category import Category
from app.models.gala import Gala
from app.models.nominee import Nominee
from app.models.vote import Vote
from app.services.certificates import render_certificate

router = APIRouter(prefix="/certificates", tags=["certificates"], dependencies=[Depends(require_admin)])


@router.get("/nominee/{nominee_id}")
def certificate_nominee(nominee_id: int, db: Session = Depends(get_db)) -> Response:
    nominee = db.get(Nominee, nominee_id)
    if nominee is None:
        raise HTTPException(status_code=404, detail="Nominé introuvable")
    cat = db.get(Category, nominee.category_id)
    if cat is None:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    gala = db.get(Gala, cat.gala_id)
    if gala is None:
        raise HTTPException(status_code=404, detail="Gala introuvable")

    # Determine if nominee is the leader of the category (winner)
    rows = db.execute(
        select(Nominee.id, func.count(Vote.id).label("votes"))
        .outerjoin(Vote, Vote.nominee_id == Nominee.id)
        .where(Nominee.category_id == cat.id)
        .group_by(Nominee.id)
        .order_by(func.count(Vote.id).desc())
    ).all()
    leader_id = rows[0].id if rows else None

    pdf = render_certificate(
        nominee_name=nominee.name,
        category_name=cat.name,
        gala_name=gala.name,
        edition_year=gala.edition_year,
        event_date=gala.event_date,
        location=gala.location,
        school_promotion=nominee.school_promotion,
        is_winner=(leader_id == nominee.id),
    )
    filename = f"certificat-{nominee.name.replace(' ', '_')}-{gala.edition_year}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/category/{category_id}/winner")
def certificate_winner(category_id: int, db: Session = Depends(get_db)) -> Response:
    cat = db.get(Category, category_id)
    if cat is None:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    rows = db.execute(
        select(Nominee, func.count(Vote.id).label("votes"))
        .outerjoin(Vote, Vote.nominee_id == Nominee.id)
        .where(Nominee.category_id == cat.id)
        .group_by(Nominee.id)
        .order_by(func.count(Vote.id).desc())
    ).all()
    if not rows or rows[0].votes == 0:
        raise HTTPException(status_code=404, detail="Aucun vote dans cette catégorie")
    winner: Nominee = rows[0][0]
    return certificate_nominee(winner.id, db)
