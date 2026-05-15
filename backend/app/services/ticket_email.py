"""Send the ticket to the buyer by email.

The email body shows the same composite ticket image (template + dynamic
overlays) that the cashier sees on screen, embedded inline via Content-ID.
The PDF attached is the same image, wrapped in a printable A4 landscape page.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.gala import Gala
from app.models.ticket import Ticket
from app.services.email import send_email
from app.services.ticket_image import render_ticket_image
from app.services.ticket_pdf import render_ticket_pdf

TYPE_LABEL = {"solo": "Solo", "duo": "Duo", "gbonhi": "Gbonhi"}


def _format_money(value: float) -> str:
    return f"{int(round(value)):,}".replace(",", " ") + " Fcfa"


def _format_date(d: datetime) -> str:
    months = [
        "janvier",
        "février",
        "mars",
        "avril",
        "mai",
        "juin",
        "juillet",
        "août",
        "septembre",
        "octobre",
        "novembre",
        "décembre",
    ]
    return f"{d.day} {months[d.month - 1]} {d.year}"


def build_ticket_email_html(
    ticket: Ticket, gala: Gala, recipient_name: str | None = None
) -> str:
    """Build the HTML body — features the composite ticket image inline."""
    name_to_use = recipient_name or ticket.buyer_full_name
    type_label = TYPE_LABEL.get(str(ticket.type), str(ticket.type))

    extra_rows = ""
    if ticket.partner_full_name:
        extra_rows += (
            '<tr><td style="padding:6px 0;color:#A89A9A;font-size:13px;">'
            "Partenaire</td><td style=\"padding:6px 0;text-align:right;"
            "color:#FFFFFF;font-weight:500;\">"
            f"{ticket.partner_full_name}</td></tr>"
        )
    if ticket.group_size:
        extra_rows += (
            '<tr><td style="padding:6px 0;color:#A89A9A;font-size:13px;">'
            "Groupe</td><td style=\"padding:6px 0;text-align:right;"
            "color:#FFFFFF;font-weight:500;\">"
            f"{ticket.group_size} personnes</td></tr>"
        )

    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0E0808;font-family:Arial, Helvetica, sans-serif;color:#FFFFFF;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0E0808;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="max-width:640px;background:linear-gradient(180deg,#1A1010 0%,#0E0808 100%);border:1px solid #3A2828;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <table role="presentation" width="100%"><tr>
            <td style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#FFFFFF;letter-spacing:0.02em;">IT <span style="color:#F0A50C;">Gala</span></td>
            <td style="text-align:right;font-size:11px;color:#F0A50C;letter-spacing:0.2em;text-transform:uppercase;">Édition {gala.edition_year}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 32px 24px 32px;">
          <p style="margin:18px 0 6px 0;font-size:11px;letter-spacing:0.25em;color:#F0A50C;text-transform:uppercase;">Votre billet d'entrée</p>
          <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:28px;line-height:1.15;color:#FFFFFF;">Bienvenue à la nuit de la <span style="color:#FBC23A;font-style:italic;">tech ivoirienne</span></h1>
          <p style="margin:0;color:#C9B8B8;font-size:14px;line-height:1.6;">Bonjour {name_to_use}, votre place pour le <strong>{gala.name} {gala.edition_year}</strong> est confirmée. Votre ticket figure ci-dessous — présentez le QR code à l'entrée pour la validation.</p>
        </td></tr>

        <!-- Composite ticket image (template + overlays) -->
        <tr><td style="padding:8px 24px 24px 24px;" align="center">
          <img src="cid:ticket_image" alt="Votre ticket IT Gala 2026"
               width="592"
               style="display:block;width:100%;max-width:592px;height:auto;border-radius:12px;border:1px solid rgba(240,165,12,0.25);" />
          <p style="margin:14px 0 0 0;font-family:'Courier New',monospace;font-size:13px;letter-spacing:0.18em;color:#FBC23A;font-weight:bold;">{ticket.code}</p>
          <p style="margin:4px 0 0 0;font-size:11px;color:#A89A9A;">Type : Ticket {type_label}</p>
        </td></tr>

        <!-- Details -->
        <tr><td style="padding:0 32px 28px 32px;">
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

        <tr><td style="padding:0 32px 28px 32px;">
          <p style="margin:0;color:#A89A9A;font-size:12px;line-height:1.6;">
            Ce billet est strictement personnel et ne peut être utilisé qu'une seule fois.
            Conservez précieusement cet email — le PDF ci-joint fait office de justificatif d'entrée.
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


def build_ticket_email_text(
    ticket: Ticket, gala: Gala, recipient_name: str | None = None
) -> str:
    name_to_use = recipient_name or ticket.buyer_full_name
    type_label = TYPE_LABEL.get(str(ticket.type), str(ticket.type))
    extras = []
    if ticket.partner_full_name:
        extras.append(f"Partenaire    : {ticket.partner_full_name}")
    if ticket.group_size:
        extras.append(f"Groupe        : {ticket.group_size} personnes")
    extras_block = ("\n" + "\n".join(extras)) if extras else ""
    return (
        f"Bonjour {name_to_use},\n\n"
        f"Votre billet pour le {gala.name} {gala.edition_year} est confirmé.\n"
        f"Le ticket figure dans la version HTML de cet email, ainsi qu'en\n"
        f"piece jointe PDF. Presentez le QR code a l'entree pour la validation.\n\n"
        f"---------- VOTRE TICKET ----------\n"
        f"N°            : {ticket.id}\n"
        f"Code          : {ticket.code}\n"
        f"Type          : Ticket {type_label}\n"
        f"Acheteur      : {ticket.buyer_full_name}{extras_block}\n"
        f"Date          : {_format_date(gala.event_date)}\n"
        f"Lieu          : {gala.location}\n"
        f"Total paye    : {_format_money(ticket.price)}\n"
        f"-----------------------------------\n\n"
        f"Ce billet est strictement personnel et ne peut etre utilise qu'une seule fois.\n\n"
        f"L'equipe IT Gala\n"
    )


def send_ticket_email(
    db: Session,
    ticket: Ticket,
    gala: Gala,
    recipient_name: str | None = None,
    recipient_email: str | None = None,
) -> None:
    """Send the ticket by email — silent on failure (logged in notifications)."""
    to_email = recipient_email or ticket.buyer_email
    if not to_email:
        return
    try:
        # Single source of truth for the visual : the composite PNG image.
        png = render_ticket_image(
            ticket_id=ticket.id,
            ticket_code=ticket.code,
            price=ticket.price,
        )
        pdf = render_ticket_pdf(
            ticket_id=ticket.id,
            ticket_code=ticket.code,
            price=ticket.price,
        )

        html = build_ticket_email_html(ticket, gala, recipient_name)
        text = build_ticket_email_text(ticket, gala, recipient_name)

        send_email(
            db,
            to=to_email,
            subject=f"Votre billet — {gala.name} {gala.edition_year}",
            body=text,
            html=html,
            inline_images=[("ticket_image", png, "png")],
            attachments=[(f"ticket-{ticket.code}.pdf", pdf, "application/pdf")],
        )
    except Exception:
        import logging
        logging.exception("Erreur lors de l'envoi du ticket par email")
