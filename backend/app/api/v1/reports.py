from datetime import datetime

from fastapi import APIRouter, Depends, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.category import Category
from app.models.gala import Gala
from app.models.nominee import Nominee
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole
from app.models.vote import Vote
from app.schemas.report import CategoryResult, DashboardStats, FullReport, TicketTypeStat
from app.services.report_xlsx import build_report_xlsx

router = APIRouter(prefix="/reports", tags=["reports"], dependencies=[Depends(require_admin)])


def _stats(db: Session) -> DashboardStats:
    active = db.scalar(select(Gala).where(Gala.is_active.is_(True)).order_by(Gala.edition_year.desc()))
    return DashboardStats(
        total_galas=int(db.scalar(select(func.count(Gala.id))) or 0),
        active_gala_id=active.id if active else None,
        total_users=int(db.scalar(select(func.count(User.id))) or 0),
        total_participants=int(db.scalar(select(func.count(User.id)).where(User.role == UserRole.PARTICIPANT)) or 0),
        total_tickets_sold=int(db.scalar(select(func.count(Ticket.id))) or 0),
        total_tickets_scanned=int(db.scalar(select(func.count(Ticket.id)).where(Ticket.status == TicketStatus.SCANNED)) or 0),
        total_revenue=float(db.scalar(select(func.coalesce(func.sum(Ticket.price), 0))) or 0),
        total_votes=int(db.scalar(select(func.count(Vote.id))) or 0),
        total_categories=int(db.scalar(select(func.count(Category.id))) or 0),
        total_nominees=int(db.scalar(select(func.count(Nominee.id))) or 0),
    )


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db)) -> DashboardStats:
    return _stats(db)


@router.get("/full", response_model=FullReport)
def full_report(db: Session = Depends(get_db)) -> FullReport:
    stats = _stats(db)

    type_rows = db.execute(
        select(Ticket.type, func.count(Ticket.id), func.coalesce(func.sum(Ticket.price), 0)).group_by(Ticket.type)
    ).all()
    by_type = [TicketTypeStat(type=str(r[0]), count=int(r[1]), revenue=float(r[2])) for r in type_rows]

    cats = db.scalars(select(Category).order_by(Category.order_index, Category.id)).all()
    cat_results: list[CategoryResult] = []
    for c in cats:
        rows = db.execute(
            select(Nominee.id, Nominee.name, func.count(Vote.id).label("votes"))
            .outerjoin(Vote, Vote.nominee_id == Nominee.id)
            .where(Nominee.category_id == c.id)
            .group_by(Nominee.id, Nominee.name)
            .order_by(func.count(Vote.id).desc())
        ).all()
        total = sum(int(r.votes) for r in rows)
        leader = rows[0] if rows else None
        cat_results.append(
            CategoryResult(
                category_id=c.id,
                category_name=c.name,
                leader_nominee_id=int(leader.id) if leader else None,
                leader_nominee_name=str(leader.name) if leader else None,
                leader_votes=int(leader.votes) if leader else 0,
                total_votes=total,
            )
        )

    return FullReport(stats=stats, tickets_by_type=by_type, category_results=cat_results)


@router.get("/full.xlsx")
def full_xlsx(db: Session = Depends(get_db)) -> Response:
    data = build_report_xlsx(db)
    filename = f"rapport-it-gala-{datetime.now().strftime('%Y-%m-%d')}.xlsx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
