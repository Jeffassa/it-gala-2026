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
# 2. Nom de la personne qui a achete le ticket, centre sous "Behind the mask"
_NAME_POS_PCT = (0.45, 0.68)
# 3. Libelle du type (Ticket Solo / Duo / Gbonhi) : centre du cadre dore
_TYPE_POS_PCT = (0.65, 0.86)
# 4. QR : centre de la zone blanche
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
_NUMBER_FONT_SIZE = 32   # Poppins ExtraLight Italic — "Ticket N°{id}" (13pt)
_NAME_FONT_SIZE = 36     # Poppins Medium — nom de l'acheteur (20px CSS)
_TYPE_FONT_SIZE = 44     # Poppins Medium Italic — "Ticket Solo/Duo/Gbonhi"
_CODE_FONT_SIZE = 14     # monospace fallback sous le QR


# Libelle visible du type de ticket
_TYPE_LABEL = {"solo": "Solo", "duo": "Duo", "gbonhi": "Gbonhi"}


def _ticket_type_full_label(ticket_type: str) -> str:
    """Returns 'Ticket Solo' / 'Ticket Duo' / 'Ticket Gbonhi'."""
    if not ticket_type:
        return ""
    base = _TYPE_LABEL.get(ticket_type.lower(), ticket_type.capitalize())
    return f"Ticket {base}"


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


def _draw_ticket_type(
    draw: ImageDraw.ImageDraw,
    ticket_type: str,
    center_xy: tuple[int, int],
) -> None:
    """Draw 'Ticket Solo' / 'Ticket Duo' / 'Ticket Gbonhi' centered in the
    gold-bordered frame, in Poppins Medium Italic.
    """
    label = _ticket_type_full_label(ticket_type)
    if not label:
        return

    cx, cy = center_xy
    font = _load_font("Poppins-MediumItalic.ttf", _TYPE_FONT_SIZE)
    try:
        bbox = draw.textbbox((0, 0), label, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        # Compensation precise : on utilise le bbox top pour le centrage vertical
        offset_y = bbox[1]
    except AttributeError:
        text_w, text_h = draw.textsize(label, font=font)
        offset_y = 0

    # Centrage parfait : x = cx - w/2, y = cy - h/2 - offset_y
    draw.text(
        (cx - text_w // 2, cy - text_h // 2 - offset_y),
        label,
        font=font,
        fill=_CREAM,
    )


def render_ticket_image(
    *,
    ticket_id: int,
    ticket_code: str,
    price: float = 0.0,         # conserve pour compat ; plus utilise au visuel
    ticket_type: str = "",       # 'solo' / 'duo' / 'gbonhi'
    buyer_name: str = "",
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

    # ---- 2. Nom de l'acheteur (centre sous "Behind the mask") ---------
    if buyer_name:
        name_font = _load_font("Poppins-Medium.ttf", _NAME_FONT_SIZE)
        try:
            name_bbox = draw.textbbox((0, 0), buyer_name, font=name_font)
            name_w = name_bbox[2] - name_bbox[0]
            name_h = name_bbox[3] - name_bbox[1]
            name_offset_y = name_bbox[1]
        except AttributeError:
            name_w, name_h = draw.textsize(buyer_name, font=name_font)
            name_offset_y = 0
        name_cx = int(w * _NAME_POS_PCT[0])
        name_cy = int(h * _NAME_POS_PCT[1])
        draw.text(
            (name_cx - name_w // 2, name_cy - name_h // 2 - name_offset_y),
            buyer_name,
            font=name_font,
            fill=_CREAM,
        )

    # ---- 3. Ticket type label (centered in gold-bordered box) ---------
    type_cx = int(w * _TYPE_POS_PCT[0])
    type_cy = int(h * _TYPE_POS_PCT[1])
    _draw_ticket_type(draw, ticket_type, (type_cx, type_cy))

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
