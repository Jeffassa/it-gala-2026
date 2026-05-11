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

    # Compact Card (Landscape style)
    card_w = 180 * mm
    card_h = 85 * mm
    card_x = (width - card_w) / 2
    card_y = height - 20 * mm - card_h # Top of the page

    # Card Background/Borders
    c.setStrokeColor(BORDEAUX)
    c.setLineWidth(1.5)
    c.roundRect(card_x, card_y, card_w, card_h, 8 * mm, stroke=1, fill=0)
    
    c.setStrokeColor(ROSE_GOLD)
    c.setLineWidth(0.6)
    c.roundRect(card_x + 2*mm, card_y + 2*mm, card_w - 4*mm, card_h - 4*mm, 7 * mm, stroke=1, fill=0)

    # Vertical Divider
    divider_x = card_x + 65 * mm
    c.setDash(3, 3)
    c.line(divider_x, card_y + 10*mm, divider_x, card_y + card_h - 10*mm)
    c.setDash([])

    # --- LEFT PART: QR CODE ---
    qr_s = 45 * mm
    qx = card_x + (65*mm - qr_s) / 2
    qy = card_y + (card_h - qr_s) / 2 + 5*mm
    
    c.setFillColor(colors.white)
    c.roundRect(qx - 3*mm, qy - 3*mm, qr_s + 6*mm, qr_s + 6*mm, 4*mm, fill=1, stroke=0)
    
    qr_buf = _qr_png_buf(ticket_code)
    from reportlab.lib.utils import ImageReader
    c.drawImage(ImageReader(qr_buf), qx, qy, width=qr_s, height=qr_s)
    
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Courier-Bold", 10)
    c.drawCentredString(card_x + 32.5*mm, qy - 8 * mm, ticket_code)

    # --- RIGHT PART: INFO ---
    right_x = divider_x + 8 * mm
    ty = card_y + card_h - 15 * mm
    
    c.setFillColor(ROSE_GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(right_x, ty, "IT GALA AWARDS")
    
    c.setFillColor(BORDEAUX)
    c.setFont("Times-Bold", 18)
    c.drawString(right_x, ty - 8 * mm, gala_name.upper())
    
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(right_x, ty - 16 * mm, f"BILLET {ticket_type.upper()}")

    # Buyer
    c.setFillColor(colors.whitesmoke)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(right_x, ty - 28 * mm, buyer_name)
    if partner_name:
        c.setFont("Helvetica", 9)
        c.setFillColor(MUTED)
        c.drawString(right_x, ty - 33 * mm, f"+ {partner_name}")

    # Details
    det_y = ty - 45 * mm
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(right_x, det_y, f"Date :")
    c.drawString(right_x, det_y - 4*mm, f"Lieu :")
    
    c.setFillColor(colors.whitesmoke)
    c.drawString(right_x + 12*mm, det_y, event_date.strftime("%d %b %Y"))
    c.drawString(right_x + 12*mm, det_y - 4*mm, location[:35]) # Truncate long locations

    # Price
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Helvetica-Bold", 16)
    p_str = f"{int(price):,} FCFA".replace(",", " ")
    c.drawRightString(card_x + card_w - 10*mm, card_y + 10 * mm, p_str)

    # Fine print
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawString(right_x, card_y + 8 * mm, "Billet personnel et unique. Présentez le QR code à l'entrée.")

    c.showPage()
    c.save()
    return buf.getvalue()

    c.showPage()
    c.save()
    return buf.getvalue()
