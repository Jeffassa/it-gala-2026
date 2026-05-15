"""Generate a composite ticket image: load the design template, overlay the
ticket number, the price, and the QR code on the right white area.

The same rendering is used for the PDF attachment and the inline email image,
so the buyer sees exactly the same visual as the cashier on screen.
"""

from __future__ import annotations

import io
import logging
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# --- Asset paths ---
_BASE_DIR = Path(__file__).resolve().parent.parent
_TEMPLATE_PATH = _BASE_DIR / "static" / "tickets" / "ticket_template.png"
_FONTS_DIR = _BASE_DIR / "static" / "fonts"

# --- Template metadata (calibrated on 1654 x 472 image) ---
_TEMPLATE_W = 1654
_TEMPLATE_H = 472

# Positions (% of template, mirror of frontend POS_*) ----------------------
# 1. "Ticket N°{id}" : texte COMPLET (le template ne contient pas ce texte).
#    Coordonnee = coin haut-gauche du texte.
_NUMBER_POS_PCT = (0.33, 0.12)
# 2. Prix : centre du cadre dore
_PRICE_POS_PCT = (0.66, 0.84)
# 3. QR : centre de la zone blanche
_QR_CENTER_PCT = (0.89, 0.49)
_QR_SIZE_PCT = 0.15  # 15% of template width

# Couleurs (alignees sur le rendu CSS frontend)
_CREAM = (247, 231, 196)  # #f7e7c4 — texte sur fond brun (N° + Prix)
_DARK = (26, 10, 5)        # #1a0a05 — code alphanum sur fond blanc
_QR_DARK = (26, 10, 5)

# Tailles de police (px PIL au rendu natif 1654 px de large).
# Le template est rendu a plus haute resolution que l'ecran final
# (facteur ~1.83x entre 96 DPI / CSS et le pixel natif du template),
# donc les valeurs CSS spec sont multipliees par ce facteur.
_NUMBER_FONT_SIZE = 28   # Poppins ExtraLight Italic — "Ticket N°{id}" (11pt)
_PRICE_NUMBER_SIZE = 49  # Poppins Medium Italic — chiffres du prix (27px CSS)
_PRICE_F_SIZE = 42       # Poppins Medium Italic — "F" majuscule    (23px CSS)
_PRICE_CFA_SIZE = 40     # Poppins Medium Italic — "cfa" minuscules (22px CSS)
_CODE_FONT_SIZE = 14     # monospace fallback sous le QR


def _load_font(filename: str, size: int) -> ImageFont.FreeTypeFont:
    """Load a TTF from backend/app/static/fonts, fallback on PIL default."""
    path = _FONTS_DIR / filename
    if path.exists():
        try:
            return ImageFont.truetype(str(path), size)
        except Exception:
            logger.exception("Failed to load font %s", path)
    logger.warning("Font missing: %s — using PIL default.", path)
    return ImageFont.load_default()


def _make_qr_image(code: str, size_px: int) -> Image.Image:
    """Generate a square QR code image at the requested size."""
    qr = qrcode.QRCode(
        version=None,
        box_size=10,
        border=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
    )
    qr.add_data(code)
    qr.make(fit=True)
    img = qr.make_image(
        fill_color=f"#{_QR_DARK[0]:02x}{_QR_DARK[1]:02x}{_QR_DARK[2]:02x}",
        back_color="#FFFFFF",
    ).convert("RGBA")
    return img.resize((size_px, size_px), Image.LANCZOS)


def _format_price_fcfa(price: float) -> str:
    """Format like '15 000 Fcfa' (matches the visual on the template).

    Used for the plain-text email fallback. The visual ticket renders the
    price in 3 size-differentiated segments via _draw_price_segments.
    """
    return f"{int(round(price)):,}".replace(",", " ") + " Fcfa"


def _draw_price_segments(
    draw: ImageDraw.ImageDraw,
    price: float,
    center_xy: tuple[int, int],
) -> None:
    """Draw the price centered at (cx, cy) with 3 segments :

        | chiffres (16px CSS / 30px PIL) | F (14/26) | cfa (11/20) |

    Baselines are aligned : the smaller fonts hang from the baseline of
    the largest, like proper typographic descenders.
    """
    cx, cy = center_xy

    number_text = f"{int(round(price)):,}".replace(",", " ")
    f_text = " F"   # leading space separates "15 000" from "Fcfa"
    cfa_text = "cfa"

    n_font = _load_font("Poppins-MediumItalic.ttf", _PRICE_NUMBER_SIZE)
    f_font = _load_font("Poppins-MediumItalic.ttf", _PRICE_F_SIZE)
    cfa_font = _load_font("Poppins-MediumItalic.ttf", _PRICE_CFA_SIZE)

    def _measure(text: str, font: ImageFont.FreeTypeFont) -> int:
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            return bbox[2] - bbox[0]
        except AttributeError:
            return draw.textsize(text, font=font)[0]

    n_w = _measure(number_text, n_font)
    f_w = _measure(f_text, f_font)
    cfa_w = _measure(cfa_text, cfa_font)

    total_w = n_w + f_w + cfa_w
    start_x = cx - total_w // 2

    # Baseline alignment : use the LARGEST font's ascent as the reference
    # baseline. Each segment is drawn at y = baseline - its_own_ascent
    # so all glyphs sit on the same baseline.
    n_ascent, _ = n_font.getmetrics()
    f_ascent, _ = f_font.getmetrics()
    cfa_ascent, _ = cfa_font.getmetrics()

    # On veut que la baseline tombe juste sous le centre vertical du
    # cadre dore — donc baseline = cy + ascent_max // 2.
    baseline_y = cy + n_ascent // 2

    draw.text((start_x, baseline_y - n_ascent), number_text, font=n_font, fill=_CREAM)
    draw.text((start_x + n_w, baseline_y - f_ascent), f_text, font=f_font, fill=_CREAM)
    draw.text((start_x + n_w + f_w, baseline_y - cfa_ascent), cfa_text, font=cfa_font, fill=_CREAM)


def render_ticket_image(
    *,
    ticket_id: int,
    ticket_code: str,
    price: float,
) -> bytes:
    """Return PNG bytes of the composite ticket image (template + overlays)."""
    if not _TEMPLATE_PATH.exists():
        raise FileNotFoundError(
            f"Ticket template not found at {_TEMPLATE_PATH}. "
            "Place ticket_template.png in backend/app/static/tickets/."
        )

    canvas = Image.open(_TEMPLATE_PATH).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    w, h = canvas.size
    # Should be 1654x472, but recompute in case the template is replaced.
    # We use the actual size to position elements.

    # ---- 1. Texte complet "Ticket N°{id}" ----------------------------
    # Note : le template ne contient pas ce texte, on le dessine en entier.
    number_font = _load_font("Poppins-ExtraLightItalic.ttf", _NUMBER_FONT_SIZE)
    number_text = f"Ticket N°{ticket_id}"
    number_x = int(w * _NUMBER_POS_PCT[0])
    number_y = int(h * _NUMBER_POS_PCT[1])
    draw.text(
        (number_x, number_y),
        number_text,
        font=number_font,
        fill=_CREAM,
    )

    # ---- 2. Price (centered in gold-bordered box, 3-size segments) ----
    price_cx = int(w * _PRICE_POS_PCT[0])
    price_cy = int(h * _PRICE_POS_PCT[1])
    _draw_price_segments(draw, price, (price_cx, price_cy))

    # ---- 3. QR code (centered on white area) --------------------------
    qr_size = int(w * _QR_SIZE_PCT)
    qr_img = _make_qr_image(ticket_code, qr_size)
    qr_cx = int(w * _QR_CENTER_PCT[0])
    qr_cy = int(h * _QR_CENTER_PCT[1])
    qr_x = qr_cx - qr_size // 2
    qr_y = qr_cy - qr_size // 2
    canvas.paste(qr_img, (qr_x, qr_y), qr_img)

    # ---- 4. Ticket code below QR (small monospace) --------------------
    code_font = _load_font("Poppins-MediumItalic.ttf", _CODE_FONT_SIZE)
    try:
        bbox = draw.textbbox((0, 0), ticket_code, font=code_font)
        code_w = bbox[2] - bbox[0]
    except AttributeError:
        code_w, _ = draw.textsize(ticket_code, font=code_font)
    draw.text(
        (qr_cx - code_w // 2, qr_y + qr_size + 6),
        ticket_code,
        font=code_font,
        fill=_DARK,
    )

    # ---- Export PNG ---------------------------------------------------
    out = io.BytesIO()
    canvas.convert("RGB").save(out, format="PNG", optimize=True)
    return out.getvalue()
