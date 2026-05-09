"""Validation et stockage securise des fichiers uploades (photos).

Whitelist d'extensions + verification du contenu via Pillow + limite de taille.
Empeche l'upload de fichiers executables, SVG (XSS), ou PDF deguises en images.

Stockage :
- Si Cloudinary configure (3 env vars), upload vers Cloudinary CDN
  -> url HTTPS persistante, ne se perd jamais (recommande pour prod)
- Sinon, sauvegarde sur le filesystem local backend/uploads/
  -> dev local OK, mais ephemere sur Render free tier
"""

from __future__ import annotations

import io
import logging
import os

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS: frozenset[str] = frozenset(
    {".jpg", ".jpeg", ".png", ".webp", ".gif"}
)
ALLOWED_MIME_PREFIX: str = "image/"
ALLOWED_PIL_FORMATS: frozenset[str] = frozenset({"JPEG", "PNG", "WEBP", "GIF"})

MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB

_format_to_ext: dict[str, str] = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
    "GIF": ".gif",
}

# Cloudinary lazy-init (config seulement quand on en a besoin)
_cloudinary_configured: bool = False


def _ensure_cloudinary_configured() -> None:
    global _cloudinary_configured
    if _cloudinary_configured:
        return
    if not settings.cloudinary_enabled:
        return
    import cloudinary  # noqa: import lazily

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _cloudinary_configured = True
    logger.info("[uploads] Cloudinary configure (cloud=%s)", settings.CLOUDINARY_CLOUD_NAME)


def _safe_extension(filename: str | None) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="Fichier sans nom — refus.")
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension non autorisee. Formats acceptes : {', '.join(sorted(ALLOWED_EXTENSIONS))}.",
        )
    return ext


def _validate_image(file: UploadFile) -> tuple[bytes, str]:
    """Valide l'image et renvoie (blob, extension finale .jpg/.png/...)."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Fichier manquant.")

    _safe_extension(file.filename)

    blob = file.file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if len(blob) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux. Limite : {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
        )
    if len(blob) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide.")

    try:
        with Image.open(io.BytesIO(blob)) as img:
            img.verify()
        with Image.open(io.BytesIO(blob)) as img:
            pil_format = (img.format or "").upper()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail="Fichier invalide : impossible de lire le contenu comme image.",
        ) from exc

    if pil_format not in ALLOWED_PIL_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Format d'image non supporte : {pil_format or 'inconnu'}.",
        )

    return blob, _format_to_ext[pil_format]


def _save_to_disk(blob: bytes, ext: str, target_dir: str, base_name: str | int) -> tuple[str, str]:
    """Fallback : sauvegarde sur le filesystem local."""
    os.makedirs(target_dir, exist_ok=True)
    filename = f"{base_name}{ext}"
    filepath = os.path.join(target_dir, filename)

    with open(filepath, "wb") as fh:
        fh.write(blob)

    # Nettoyer les anciennes versions avec une autre extension
    for other_ext in ALLOWED_EXTENSIONS:
        if other_ext == ext:
            continue
        old = os.path.join(target_dir, f"{base_name}{other_ext}")
        if os.path.exists(old):
            try:
                os.remove(old)
            except OSError:
                pass

    return filepath, filename


def _upload_to_cloudinary(blob: bytes, folder: str, public_id: str) -> str:
    """Upload vers Cloudinary, renvoie l'URL HTTPS publique."""
    _ensure_cloudinary_configured()
    import cloudinary.uploader  # noqa: lazy

    try:
        result = cloudinary.uploader.upload(
            blob,
            folder=folder,                 # ex: "it-gala/souvenirs"
            public_id=public_id,            # ex: "5"
            overwrite=True,
            invalidate=True,                # purge le cache CDN si on remplace
            resource_type="image",
            # Optimisations automatiques (qualite & format selon le navigateur)
            transformation=[{"quality": "auto", "fetch_format": "auto"}],
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("[uploads] Cloudinary upload failed")
        raise HTTPException(
            status_code=502,
            detail=f"Echec upload Cloudinary : {exc}",
        ) from exc

    url = result.get("secure_url")
    if not url:
        raise HTTPException(status_code=502, detail="Cloudinary n'a pas retourne d'URL.")
    return url


def save_image_upload(
    file: UploadFile,
    *,
    target_dir: str,
    base_name: str | int,
) -> tuple[str, str]:
    """Valide et stocke une image. Renvoie (storage_id, public_url).

    storage_id : pour le disque, le filepath ; pour Cloudinary, le public_id.
    public_url : pour le disque, le filename ; pour Cloudinary, l'URL HTTPS.

    L'appelant utilise public_url pour construire le `image_url` en DB.

    Bascule transparente :
    - Si Cloudinary configure -> upload CDN, URL HTTPS persistante
    - Sinon -> fichier sur disque (legacy / dev local)
    """
    blob, ext = _validate_image(file)

    if settings.cloudinary_enabled:
        # target_dir = "uploads/souvenirs" -> folder Cloudinary "it-gala/souvenirs"
        folder = "it-gala/" + os.path.basename(target_dir.rstrip("/"))
        public_id = str(base_name)
        url = _upload_to_cloudinary(blob, folder=folder, public_id=public_id)
        # storage_id = identifiant Cloudinary, url = URL HTTPS publique
        return f"cloudinary:{folder}/{public_id}", url

    # Fallback disque (dev local, ou prod sans config Cloudinary)
    return _save_to_disk(blob, ext, target_dir, base_name)
