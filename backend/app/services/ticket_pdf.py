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

    # Main Card (Much larger to fit all info)
    card_margin_side = 15 * mm
    card_margin_top = 15 * mm
    card_width = width - 2 * card_margin_side
    card_height = 260 * mm # Increased from 180mm
    card_y = height - card_margin_top - card_height

    c.setStrokeColor(BORDEAUX)
    c.setLineWidth(1.5)
    c.roundRect(card_margin_side, card_y, card_width, card_height, 12 * mm, stroke=1, fill=0)

    # Inner border
    c.setStrokeColor(ROSE_GOLD)
    c.setLineWidth(0.7)
    c.roundRect(card_margin_side + 3*mm, card_y + 3*mm, card_width - 6*mm, card_height - 6*mm, 10 * mm, stroke=1, fill=0)

    # Header (y: ~280mm down to 250mm)
    header_top_y = height - 35 * mm
    c.setFillColor(ROSE_GOLD)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(width / 2, header_top_y, "★   I T   A W A R D S   ★")
    
    c.setFillColor(BORDEAUX)
    c.setFont("Times-Bold", 36)
    c.drawCentredString(width / 2, header_top_y - 18 * mm, gala_name.upper())
    
    c.setFillColor(ROSE_GOLD)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(width / 2, header_top_y - 26 * mm, f"ÉDITION {edition_year}")

    # Attendee Info (y: 235mm)
    info_y = header_top_y - 50 * mm
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, info_y, f"BILLET {ticket_type.upper()}")
    
    c.setFillColor(colors.whitesmoke)
    c.setFont("Helvetica-Bold", 16)
    # Handle potentially long names by limiting font size
    name_font_size = 16 if len(buyer_name) < 25 else 13
    c.setFont("Helvetica-Bold", name_font_size)
    c.drawCentredString(width / 2, info_y - 10 * mm, buyer_name)
    
    if partner_name:
        c.setFont("Helvetica", 11)
        c.setFillColor(MUTED)
        c.drawCentredString(width / 2, info_y - 17 * mm, f"Accompagné(e) de : {partner_name}")

    # QR Code (y: 205mm down to 135mm)
    qr_size = 60 * mm
    qr_x = (width - qr_size) / 2
    qr_y = info_y - 85 * mm
    
    c.setFillColor(colors.white)
    c.roundRect(qr_x - 6*mm, qr_y - 6*mm, qr_size + 12*mm, qr_size + 12*mm, 6*mm, fill=1, stroke=0)
    
    qr_buf = _qr_png_buf(ticket_code)
    from reportlab.lib.utils import ImageReader
    img = ImageReader(qr_buf)
    c.drawImage(img, qr_x, qr_y, width=qr_size, height=qr_size)

    # Ticket Code
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Courier-Bold", 14)
    c.drawCentredString(width / 2, qr_y - 14 * mm, ticket_code)

    # Event Details (y: 110mm)
    details_base_y = qr_y - 40 * mm
    c.setStrokeColor(ROSE_GOLD)
    c.setLineWidth(0.6)
    c.line(card_margin_side + 25*mm, details_base_y + 8*mm, width - card_margin_side - 25*mm, details_base_y + 8*mm)

    c.setFont("Helvetica", 12)
    c.setFillColor(MUTED)
    
    def draw_detail(label, value, y):
        c.drawRightString(width / 2 - 8*mm, y, f"{label} :")
        c.setFillColor(colors.whitesmoke)
        c.drawString(width / 2 + 8*mm, y, str(value))
        c.setFillColor(MUTED)

    draw_detail("Date", event_date.strftime("%d %B %Y"), details_base_y)
    draw_detail("Lieu", location, details_base_y - 10*mm)
    if attendee_status:
        draw_detail("Statut", attendee_status, details_base_y - 20*mm)
    
    # Price (y: 50mm)
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Helvetica-Bold", 26)
    price_str = f"{int(price):,} FCFA".replace(",", " ")
    c.drawCentredString(width / 2, card_y + 25 * mm, price_str)

    # Footer
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    c.drawCentredString(width / 2, card_y + 12 * mm, "Présentez ce QR Code à l'entrée. Billet personnel et unique.")

    c.showPage()
    c.save()
    return buf.getvalue()
