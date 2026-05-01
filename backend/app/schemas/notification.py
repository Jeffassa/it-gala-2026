from datetime import datetime

from pydantic import BaseModel

from app.models.notification import NotificationChannel, NotificationStatus


class NotificationOut(BaseModel):
    id: int
    channel: NotificationChannel
    status: NotificationStatus
    recipient: str
    subject: str | None
    body: str
    error: str | None
    user_id: int | None
    created_at: datetime
    sent_at: datetime | None

    class Config:
        from_attributes = True


class BroadcastRequest(BaseModel):
    subject: str
    body: str
    role: str | None = None  # optional filter (participant, cashier, controller, super_admin)
