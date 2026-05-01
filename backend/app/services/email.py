"""Email service.

Uses Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email)
when RESEND_API_KEY is set — works on Render free tier (port 443 / HTTPS only).

Falls back to SMTP if MAIL_HOST is set without RESEND_API_KEY (dev only — Render
free blocks outbound SMTP).

Falls back to console output otherwise.

Records every send attempt in the `notifications` table for audit / journalisation.
Supports plain-text, HTML, and inline image attachments (e.g. QR codes).
"""
from __future__ import annotations

import base64
import json
import smtplib
import ssl
import urllib.error
import urllib.request
from datetime import datetime
from email.message import EmailMessage
from typing import Iterable

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification, NotificationChannel, NotificationStatus


def _from_header() -> str:
    return f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"


def _send_via_resend(
    *,
    to: str,
    subject: str,
    body: str,
    html: str | None,
    inline_images: Iterable[tuple[str, bytes, str]] | None,
) -> tuple[bool, str | None]:
    """POST to Resend API. Returns (ok, error_message)."""
    payload: dict = {
        "from": _from_header(),
        "to": [to],
        "subject": subject,
        "text": body,
    }
    if html:
        payload["html"] = html

    if inline_images:
        attachments = []
        for cid, data, subtype in inline_images:
            attachments.append({
                "filename": f"{cid}.{subtype}",
                "content": base64.b64encode(data).decode("ascii"),
                "content_id": cid,
                "disposition": "inline",
            })
        payload["attachments"] = attachments

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "IT-Gala/1.0 (+https://it-gala.onrender.com)",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
            if 200 <= resp.status < 300:
                return True, None
            return False, f"Resend HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8", errors="ignore")[:300]
        except Exception:  # noqa: BLE001
            err_body = ""
        return False, f"Resend HTTP {e.code}: {err_body}"
    except Exception as e:  # noqa: BLE001
        return False, f"Resend error: {e}"


def _send_via_smtp(
    *,
    to: str,
    subject: str,
    body: str,
    html: str | None,
    inline_images: Iterable[tuple[str, bytes, str]] | None,
) -> tuple[bool, str | None]:
    try:
        msg = EmailMessage()
        msg["From"] = _from_header()
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)
        if html:
            msg.add_alternative(html, subtype="html")
            if inline_images:
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
        return True, None
    except Exception as e:  # noqa: BLE001
        return False, f"SMTP error: {e}"


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
    """Send an email and record the attempt. Returns the Notification row."""
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

    # Choose transport
    if settings.RESEND_API_KEY:
        ok, error = _send_via_resend(to=to, subject=subject, body=body, html=html, inline_images=inline_images)
    elif settings.MAIL_HOST:
        ok, error = _send_via_smtp(to=to, subject=subject, body=body, html=html, inline_images=inline_images)
    else:
        # Console fallback (dev mode without any provider)
        if settings.MAIL_DEBUG:
            try:
                print("\n" + "=" * 60)
                print(f"[EMAIL -> {to}] {subject}")
                print("-" * 60)
                print(body)
                print("=" * 60 + "\n")
            except UnicodeEncodeError:
                pass
        ok, error = True, None

    if ok:
        notif.status = NotificationStatus.SENT
        notif.sent_at = datetime.utcnow()
    else:
        notif.status = NotificationStatus.FAILED
        notif.error = error
    db.commit()
    db.refresh(notif)
    return notif
