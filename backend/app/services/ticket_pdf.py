"""Ticket PDF generation using ReportLab.
"""

from __future__ import annotations

import io
from datetime import datetime

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

BORDEAUX = colors.HexColor("#6D071A")
ROSE_GOLD = colors.HexColor("#B76E79")
ROSE_GOLD_LIGHT = colors.HexColor("#E0BFB8")
BLACK = colors.HexColor("#08080c")
MUTED = colors.HexColor("#A89A9A")


def _qr_png_buf(code: str) -> io.BytesIO:
    qr = qrcode.QRCode(version=None, box_size=10, border=1)
    qr.add_data(code)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#000000", back_color="#FFFFFF")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def render_ticket_pdf(
    *,
    ticket_code: str,
    buyer_name: str,
    ticket_type: str,
    gala_name: str,
    edition_year: int,
    event_date: datetime,
    location: str,
    price: float,
    attendee_status: str | None = None,
    partner_name: str | None = None,
) -> bytes:
    """Render a ticket PDF and return its bytes."""
    buf = io.BytesIO()
    # Portrait A4
    page_size = A4
    width, height = page_size
    c = canvas.Canvas(buf, pagesize=page_size)

    # Background
    c.setFillColor(BLACK)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Main Card
    card_margin = 20 * mm
    card_width = width - 2 * card_margin
    card_height = 180 * mm
    card_y = height - card_margin - card_height

    c.setStrokeColor(BORDEAUX)
    c.setLineWidth(1)
    c.roundRect(card_margin, card_y, card_width, card_height, 10 * mm, stroke=1, fill=0)

    # Inner border
    c.setStrokeColor(ROSE_GOLD)
    c.setLineWidth(0.5)
    c.roundRect(card_margin + 2*mm, card_y + 2*mm, card_width - 4*mm, card_height - 4*mm, 8 * mm, stroke=1, fill=0)

    # Header (y: 260mm down to 230mm)
    header_y = height - 40 * mm
    c.setFillColor(ROSE_GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width / 2, header_y, "★  IT  AWARDS  ★")
    
    c.setFillColor(BORDEAUX)
    c.setFont("Times-Bold", 32)
    c.drawCentredString(width / 2, header_y - 15 * mm, gala_name.upper())
    
    c.setFillColor(ROSE_GOLD)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width / 2, header_y - 22 * mm, f"ÉDITION {edition_year}")

    # Attendee Info (y: 220mm)
    info_y = header_y - 45 * mm
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, info_y, f"BILLET {ticket_type.upper()}")
    
    c.setFillColor(colors.whitesmoke)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, info_y - 8 * mm, buyer_name)
    if partner_name:
        c.setFont("Helvetica", 11)
        c.drawCentredString(width / 2, info_y - 14 * mm, f"Accompagné(e) de : {partner_name}")

    # QR Code (y: 180mm down to 110mm)
    qr_size = 65 * mm
    qr_x = (width - qr_size) / 2
    qr_y = info_y - 85 * mm
    
    # White background for QR
    c.setFillColor(colors.white)
    c.roundRect(qr_x - 5*mm, qr_y - 5*mm, qr_size + 10*mm, qr_size + 10*mm, 5*mm, fill=1, stroke=0)
    
    qr_buf = _qr_png_buf(ticket_code)
    from reportlab.lib.utils import ImageReader
    img = ImageReader(qr_buf)
    c.drawImage(img, qr_x, qr_y, width=qr_size, height=qr_size)

    # Ticket Code
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Courier-Bold", 14)
    c.drawCentredString(width / 2, qr_y - 12 * mm, ticket_code)

    # Event Details (y: 80mm)
    details_y = qr_y - 35 * mm
    c.setStrokeColor(ROSE_GOLD)
    c.setLineWidth(0.5)
    c.line(card_margin + 20*mm, details_y + 5*mm, width - card_margin - 20*mm, details_y + 5*mm)

    c.setFont("Helvetica", 11)
    c.setFillColor(MUTED)
    
    def draw_detail(label, value, y):
        c.drawRightString(width / 2 - 5*mm, y, f"{label} :")
        c.setFillColor(colors.whitesmoke)
        c.drawString(width / 2 + 5*mm, y, str(value))
        c.setFillColor(MUTED)

    draw_detail("Date", event_date.strftime("%d %B %Y"), details_y - 5*mm)
    draw_detail("Lieu", location, details_y - 12*mm)
    if attendee_status:
        draw_detail("Statut", attendee_status, details_y - 19*mm)
    
    # Price (y: 40mm)
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Helvetica-Bold", 22)
    price_str = f"{int(price):,} FCFA".replace(",", " ")
    c.drawCentredString(width / 2, card_y + 20 * mm, price_str)

    # Fine print
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(width / 2, card_y + 8 * mm, "Présentez ce QR Code à l'entrée. Billet personnel et unique.")

    c.showPage()
    c.save()
    return buf.getvalue()
