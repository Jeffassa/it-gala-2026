from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_galas: int
    active_gala_id: int | None
    total_users: int
    total_participants: int
    total_tickets_sold: int
    total_tickets_scanned: int
    total_revenue: float
    total_votes: int
    total_categories: int
    total_nominees: int


class TicketTypeStat(BaseModel):
    type: str
    count: int
    revenue: float


class CategoryResult(BaseModel):
    category_id: int
    category_name: str
    leader_nominee_id: int | None
    leader_nominee_name: str | None
    leader_votes: int
    total_votes: int


class FullReport(BaseModel):
    stats: DashboardStats
    tickets_by_type: list[TicketTypeStat]
    category_results: list[CategoryResult]
