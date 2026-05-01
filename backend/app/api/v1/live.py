"""Live results — for the 'Grand écran' page during the ceremony.

Lightweight endpoint optimised for polling (1-3 seconds interval).
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.models.gala import Gala
from app.models.nominee import Nominee
from app.models.vote import Vote

router = APIRouter(prefix="/live", tags=["live"])


@router.get("/results")
def live_results(db: Session = Depends(get_db)) -> dict:
    gala = db.scalar(select(Gala).where(Gala.is_active.is_(True)).order_by(Gala.edition_year.desc()))
    if gala is None:
        return {"gala": None, "categories": []}

    cats = db.scalars(
        select(Category).where(Category.gala_id == gala.id).order_by(Category.order_index, Category.id)
    ).all()

    payload = []
    for c in cats:
        rows = db.execute(
            select(Nominee.id, Nominee.name, Nominee.school_promotion, Nominee.photo_url, func.count(Vote.id).label("votes"))
            .outerjoin(Vote, Vote.nominee_id == Nominee.id)
            .where(Nominee.category_id == c.id)
            .group_by(Nominee.id, Nominee.name, Nominee.school_promotion, Nominee.photo_url)
            .order_by(func.count(Vote.id).desc())
        ).all()
        total = sum(int(r.votes) for r in rows)
        payload.append({
            "category_id": c.id,
            "category_name": c.name,
            "category_icon": c.icon,
            "total_votes": total,
            "nominees": [
                {
                    "id": int(r.id),
                    "name": str(r.name),
                    "school_promotion": r.school_promotion,
                    "photo_url": r.photo_url,
                    "votes": int(r.votes),
                    "share": (int(r.votes) / total) if total else 0.0,
                }
                for r in rows
            ],
        })

    return {
        "gala": {
            "id": gala.id,
            "name": gala.name,
            "edition_year": gala.edition_year,
            "theme": gala.theme,
            "event_date": gala.event_date.isoformat(),
            "location": gala.location,
            "voting_open": gala.voting_open,
        },
        "categories": payload,
    }
