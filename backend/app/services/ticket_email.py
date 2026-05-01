"""Send the ticket to the buyer by email with a styled HTML template + inline QR code."""
from __future__ import annotations

import io
from datetime import datetime

import qrcode
from sqlalchemy.orm import Session

from app.models.gala import Gala
from app.models.ticket import Ticket
from app.services.email import send_email


TYPE_LABEL = {"solo": "Solo", "duo": "Duo", "gbonhi": "Gbonhi"}


def _qr_png(code: str) -> bytes:
    qr = qrcode.QRCode(version=None, box_size=8, border=2)
    qr.add_data(code)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0E0808", back_color="#FFFFFF")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _format_money(value: float) -> str:
    return f"{int(round(value)):,}".replace(",", " ") + " FCFA"


def _format_date(d: datetime) -> str:
    months = ["janvier", "février", "mars", "avril", "mai", "juin",
              "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    return f"{d.day} {months[d.month - 1]} {d.year}"


def build_ticket_email_html(ticket: Ticket, gala: Gala) -> str:
    type_label = TYPE_LABEL.get(str(ticket.type), str(ticket.type))
    extra_rows = ""
    if ticket.partner_full_name:
        extra_rows += f'<tr><td style="padding:6px 0;color:#A89A9A;font-size:13px;">Partenaire</td><td style="padding:6px 0;text-align:right;color:#FFFFFF;font-weight:500;">{ticket.partner_full_name}</td></tr>'
    if ticket.group_size:
        extra_rows += f'<tr><td style="padding:6px 0;color:#A89A9A;font-size:13px;">Groupe</td><td style="padding:6px 0;text-align:right;color:#FFFFFF;font-weight:500;">{ticket.group_size} personnes</td></tr>'

    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0E0808;font-family:Arial, Helvetica, sans-serif;color:#FFFFFF;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0E0808;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:linear-gradient(180deg,#1A1010 0%,#0E0808 100%);border:1px solid #3A2828;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <table role="presentation" width="100%"><tr>
            <td style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#FFFFFF;letter-spacing:0.02em;">IT <span style="color:#F0A50C;">Gala</span></td>
            <td style="text-align:right;font-size:11px;color:#F0A50C;letter-spacing:0.2em;text-transform:uppercase;">Édition {gala.edition_year}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 32px 24px 32px;">
          <p style="margin:18px 0 6px 0;font-size:11px;letter-spacing:0.25em;color:#F0A50C;text-transform:uppercase;">Votre billet d'entrée</p>
          <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:30px;line-height:1.15;color:#FFFFFF;">Bienvenue à la nuit de la <span style="color:#FBC23A;font-style:italic;">tech ivoirienne</span></h1>
          <p style="margin:0;color:#C9B8B8;font-size:14px;line-height:1.6;">Bonjour {ticket.buyer_full_name}, votre place pour le IT Gala {gala.edition_year} est confirmée. Présentez le QR code ci-dessous à l'entrée pour la validation.</p>
        </td></tr>

        <!-- Ticket card -->
        <tr><td style="padding:0 24px 24px 24px;">
          <table role="presentation" width="100%" style="background:linear-gradient(135deg,#330808 0%,#1A1010 100%);border:1px solid rgba(240,165,12,0.25);border-radius:18px;">
            <tr><td style="padding:28px;text-align:center;">
              <p style="margin:0 0 6px 0;font-family:Georgia,serif;font-size:13px;color:#F0A50C;letter-spacing:0.3em;text-transform:uppercase;">Ticket {type_label}</p>
              <h2 style="margin:0 0 18px 0;font-family:Georgia,serif;font-size:28px;color:#FFFFFF;">{gala.name} <span style="color:#F0A50C;">{gala.edition_year}</span></h2>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td style="background:#FFFFFF;padding:14px;border-radius:12px;">
                <img src="cid:qrcode" alt="QR Code" width="200" height="200" style="display:block;width:200px;height:200px;" />
              </td></tr></table>
              <p style="margin:18px 0 0 0;font-family:'Courier New',monospace;font-size:14px;letter-spacing:0.18em;color:#FBC23A;font-weight:bold;">{ticket.code}</p>
              <p style="margin:6px 0 0 0;font-size:11px;color:#A89A9A;">À présenter à l'entrée pour la validation</p>
            </td></tr>
            <tr><td style="padding:0 28px;"><div style="border-top:1px dashed rgba(240,165,12,0.3);"></div></td></tr>
            <tr><td style="padding:20px 28px 28px 28px;">
              <table role="presentation" width="100%" style="font-size:13px;">
                <tr><td style="padding:6px 0;color:#A89A9A;">Acheteur</td><td style="padding:6px 0;text-align:right;color:#FFFFFF;font-weight:500;">{ticket.buyer_full_name}</td></tr>
                <tr><td style="padding:6px 0;color:#A89A9A;">Email</td><td style="padding:6px 0;text-align:right;color:#FFFFFF;">{ticket.buyer_email}</td></tr>
                {extra_rows}
                <tr><td style="padding:6px 0;color:#A89A9A;">Date</td><td style="padding:6px 0;text-align:right;color:#FFFFFF;">{_format_date(gala.event_date)}</td></tr>
                <tr><td style="padding:6px 0;color:#A89A9A;">Lieu</td><td style="padding:6px 0;text-align:right;color:#FFFFFF;">{gala.location}</td></tr>
                <tr><td colspan="2" style="padding-top:12px;"><div style="border-top:1px solid #3A2828;"></div></td></tr>
                <tr><td style="padding:10px 0 0 0;color:#FFFFFF;font-weight:bold;font-size:14px;">Total payé</td><td style="padding:10px 0 0 0;text-align:right;color:#FBC23A;font-family:Georgia,serif;font-size:22px;font-weight:bold;">{_format_money(ticket.price)}</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:8px 32px 32px 32px;">
          <p style="margin:0;color:#A89A9A;font-size:12px;line-height:1.6;">
            Ce billet est strictement personnel et ne peut être utilisé qu'une seule fois. Conservez précieusement cet email — il fait office de justificatif d'entrée.
            <br /><br />Pour toute question, répondez simplement à cet email.
          </p>
        </td></tr>
        <tr><td style="background:#1A1010;border-top:1px solid #3A2828;padding:18px 32px;text-align:center;">
          <p style="margin:0;color:#8A7575;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">© {gala.edition_year} IT Gala — Une nuit pour célébrer la tech</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def build_ticket_email_text(ticket: Ticket, gala: Gala) -> str:
    type_label = TYPE_LABEL.get(str(ticket.type), str(ticket.type))
    extras = []
    if ticket.partner_full_name:
        extras.append(f"Partenaire    : {ticket.partner_full_name}")
    if ticket.group_size:
        extras.append(f"Groupe        : {ticket.group_size} personnes")
    extras_block = ("\n" + "\n".join(extras)) if extras else ""
    return (
        f"Bonjour {ticket.buyer_full_name},\n\n"
        f"Votre billet pour le {gala.name} {gala.edition_year} est confirmé.\n"
        f"Presentez le code ci-dessous a l'entree pour la validation.\n\n"
        f"---------- VOTRE TICKET ----------\n"
        f"Code          : {ticket.code}\n"
        f"Type          : Ticket {type_label}\n"
        f"Acheteur      : {ticket.buyer_full_name}{extras_block}\n"
        f"Date          : {_format_date(gala.event_date)}\n"
        f"Lieu          : {gala.location}\n"
        f"Total paye    : {_format_money(ticket.price)}\n"
        f"-----------------------------------\n\n"
        f"Ce billet est strictement personnel et ne peut etre utilise qu'une seule fois.\n"
        f"Conservez precieusement cet email - il fait office de justificatif d'entree.\n\n"
        f"L'equipe IT Gala\n"
    )


def send_ticket_email(db: Session, ticket: Ticket, gala: Gala) -> None:
    """Send the ticket by email — silent on failure (logged in notifications table)."""
    try:
        png = _qr_png(ticket.code)
        html = build_ticket_email_html(ticket, gala)
        text = build_ticket_email_text(ticket, gala)
        send_email(
            db,
            to=ticket.buyer_email,
            subject=f"Votre billet — {gala.name} {gala.edition_year}",
            body=text,
            html=html,
            inline_images=[("qrcode", png, "png")],
        )
    except Exception:
        # Failure already recorded in notifications table by send_email
        pass
