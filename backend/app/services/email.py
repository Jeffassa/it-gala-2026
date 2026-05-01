"""Lightweight email service.

Falls back to console output when SMTP is not configured (typical in dev).
Records every send attempt in the `notifications` table for audit/journalisation.
Supports plain-text, HTML, and inline image attachments (e.g. QR codes).
"""
from __future__ import annotations

import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from typing import Iterable

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification, NotificationChannel, NotificationStatus


def send_email(
    db: Session,
    *,
    to: str,
    subject: str,
    body: str,
    html: str | None = None,
    inline_images: Iterable[tuple[str, bytes, str]] | None = None,
    user_id: int | None = None,
) -> Notification:
    """Send an email and record the attempt. Returns the Notification row.

    `inline_images` is a list of (cid, png_bytes, mime_subtype) — referenced as cid:<cid> in HTML.
    """
    notif = Notification(
        channel=NotificationChannel.EMAIL,
        recipient=to,
        subject=subject,
        body=body,
        user_id=user_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    if not settings.MAIL_HOST:
        if settings.MAIL_DEBUG:
            try:
                print("\n" + "=" * 60)
                print(f"[EMAIL -> {to}] {subject}")
                print("-" * 60)
                print(body)
                print("=" * 60 + "\n")
            except UnicodeEncodeError:
                pass
        notif.status = NotificationStatus.SENT
        notif.sent_at = datetime.utcnow()
        db.commit()
        db.refresh(notif)
        return notif

    try:
        msg = EmailMessage()
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)
        if html:
            msg.add_alternative(html, subtype="html")
            if inline_images:
                # add inline images to the HTML alternative part
                html_part = msg.get_payload()[-1]
                for cid, data, subtype in inline_images:
                    html_part.add_related(data, maintype="image", subtype=subtype, cid=f"<{cid}>")

        ctx = ssl.create_default_context()
        with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT, timeout=15) as s:
            if settings.MAIL_TLS:
                s.starttls(context=ctx)
            if settings.MAIL_USERNAME:
                s.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            s.send_message(msg)

        notif.status = NotificationStatus.SENT
        notif.sent_at = datetime.utcnow()
    except Exception as exc:  # noqa: BLE001
        notif.status = NotificationStatus.FAILED
        notif.error = str(exc)
    db.commit()
    db.refresh(notif)
    return notif
