"""PDF certificate generation using ReportLab.

Generates an A4 landscape elegant certificate for a winner / nominee.
"""

from __future__ import annotations

import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

BORDEAUX = colors.HexColor("#6D071A")
ROSE_GOLD = colors.HexColor("#B76E79")
ROSE_GOLD_LIGHT = colors.HexColor("#E0BFB8")
BLACK = colors.HexColor("#08080c")
MUTED = colors.HexColor("#A89A9A")


def render_certificate(
    *,
    nominee_name: str,
    category_name: str,
    gala_name: str,
    edition_year: int,
    event_date: datetime,
    location: str,
    school_promotion: str | None = None,
    is_winner: bool = True,
) -> bytes:
    """Render a PDF certificate and return its bytes."""
    buf = io.BytesIO()
    page_size = landscape(A4)
    width, height = page_size
    c = canvas.Canvas(buf, pagesize=page_size)

    # Background — pure black
    c.setFillColor(BLACK)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Outer bordeaux border
    c.setStrokeColor(BORDEAUX)
    c.setLineWidth(3)
    c.rect(
        15 * mm, 15 * mm, width - 30 * mm, height - 30 * mm, stroke=1, fill=0
    )
    # Inner thin rose gold border
    c.setStrokeColor(ROSE_GOLD)
    c.setLineWidth(0.8)
    c.rect(
        20 * mm, 20 * mm, width - 40 * mm, height - 40 * mm, stroke=1, fill=0
    )

    # Decorative corners
    corner = 14 * mm
    for x, y in [
        (20 * mm, 20 * mm),
        (width - 20 * mm, 20 * mm),
        (20 * mm, height - 20 * mm),
        (width - 20 * mm, height - 20 * mm),
    ]:
        c.setStrokeColor(ROSE_GOLD_LIGHT)
        c.setLineWidth(1.5)
        sx = -1 if x > width / 2 else 1
        sy = -1 if y > height / 2 else 1
        c.line(x, y, x + sx * corner, y)
        c.line(x, y, x, y + sy * corner)

    # Top emblem
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width / 2, height - 38 * mm, "★  IT  AWARDS  ★")

    c.setFillColor(ROSE_GOLD)
    c.setFont("Helvetica", 8)
    c.drawCentredString(
        width / 2, height - 44 * mm, f"ÉDITION {edition_year}".upper()
    )

    # Title
    c.setFillColor(BORDEAUX)
    c.setFont("Times-Bold", 36)
    title = (
        "CERTIFICAT DE LAURÉAT" if is_winner else "CERTIFICAT DE NOMINATION"
    )
    c.drawCentredString(width / 2, height - 70 * mm, title)

    # Decorative rose gold line
    c.setStrokeColor(ROSE_GOLD)
    c.setLineWidth(1)
    line_y = height - 78 * mm
    c.line(width / 2 - 60 * mm, line_y, width / 2 + 60 * mm, line_y)

    # "Décerné à"
    c.setFillColor(MUTED)
    c.setFont("Times-Italic", 12)
    c.drawCentredString(width / 2, height - 92 * mm, "Décerné à")

    # Recipient name
    c.setFillColor(ROSE_GOLD_LIGHT)
    c.setFont("Times-Bold", 30)
    c.drawCentredString(width / 2, height - 108 * mm, nominee_name)

    if school_promotion:
        c.setFillColor(MUTED)
        c.setFont("Times-Italic", 11)
        c.drawCentredString(width / 2, height - 116 * mm, school_promotion)

    # Body
    c.setFillColor(colors.whitesmoke)
    c.setFont("Times-Roman", 13)
    body_lines = [
        ("dans la catégorie" if is_winner else "nommé(e) dans la catégorie"),
    ]
    y = height - 132 * mm
    for line in body_lines:
        c.drawCentredString(width / 2, y, line)
        y -= 6 * mm

    # Category
    c.setFillColor(ROSE_GOLD)
    c.setFont("Times-BoldItalic", 22)
    c.drawCentredString(width / 2, y - 4 * mm, f"« {category_name} »")

    # Footer info
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    footer_y = 40 * mm
    c.drawCentredString(
        width / 2,
        footer_y + 6 * mm,
        f"{gala_name} - {event_date.strftime('%d %B %Y')}".upper(),
    )
    c.drawCentredString(width / 2, footer_y, location.upper())

    # Signature placeholders
    c.setStrokeColor(ROSE_GOLD)
    c.setLineWidth(0.6)
    sig_y = 28 * mm
    c.line(45 * mm, sig_y, 95 * mm, sig_y)
    c.line(width - 95 * mm, sig_y, width - 45 * mm, sig_y)
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(MUTED)
    c.drawCentredString(70 * mm, sig_y - 4 * mm, "Le Comité d'organisation")
    c.drawCentredString(
        width - 70 * mm, sig_y - 4 * mm, "Le Président du Jury"
    )

    c.showPage()
    c.save()
    return buf.getvalue()
