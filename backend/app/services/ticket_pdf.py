"""Ticket PDF generation.

The PDF is now a thin wrapper around the composite ticket image generated
by `ticket_image.render_ticket_image()`. This guarantees that the cashier
screen, the inline email image and the PDF attachment all show the exact
same design — no drift between supports.
"""

from __future__ import annotations

import io

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdf_canvas

from app.services.ticket_image import render_ticket_image


def render_ticket_pdf(
    *,
    ticket_id: int,
    ticket_code: str,
    price: float,
    # Kept for backward compatibility; the composite image now carries
    # all the visual info, so these are unused but accepted to avoid
    # breaking existing callers.
    **_legacy_kwargs,
) -> bytes:
    """Render a one-page landscape PDF containing the ticket image.

    The image keeps the template's aspect ratio (1654/472 ~= 3.504), centered
    on the page with comfortable margins, ready for printing.
    """
    png_bytes = render_ticket_image(
        ticket_id=ticket_id,
        ticket_code=ticket_code,
        price=price,
    )

    buf = io.BytesIO()
    page_w, page_h = landscape(A4)
    c = pdf_canvas.Canvas(buf, pagesize=(page_w, page_h))

    # Fit image with margins, preserving aspect ratio.
    margin = 15 * mm
    avail_w = page_w - 2 * margin
    avail_h = page_h - 2 * margin

    img_aspect = 1654 / 472  # template ratio
    # Scale to fit width; if too tall, scale by height instead.
    img_w = avail_w
    img_h = img_w / img_aspect
    if img_h > avail_h:
        img_h = avail_h
        img_w = img_h * img_aspect

    img_x = (page_w - img_w) / 2
    img_y = (page_h - img_h) / 2

    c.drawImage(
        ImageReader(io.BytesIO(png_bytes)),
        img_x,
        img_y,
        width=img_w,
        height=img_h,
        preserveAspectRatio=True,
        mask="auto",
    )

    c.showPage()
    c.save()
    return buf.getvalue()
