"""Validation et stockage securise des fichiers uploades (photos).

Whitelist d'extensions + verification du contenu via Pillow + limite de taille.
Empeche l'upload de fichiers executables, SVG (XSS), ou PDF deguises en images.
"""

from __future__ import annotations

import io
import os

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

ALLOWED_EXTENSIONS: frozenset[str] = frozenset(
    {".jpg", ".jpeg", ".png", ".webp", ".gif"}
)
ALLOWED_MIME_PREFIX: str = "image/"
ALLOWED_PIL_FORMATS: frozenset[str] = frozenset({"JPEG", "PNG", "WEBP", "GIF"})

MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB


def _safe_extension(filename: str | None) -> str:
    """Renvoie une extension sure (`.jpg`, `.png`, etc.) ou leve 400."""
    if not filename:
        raise HTTPException(
            status_code=400, detail="Fichier sans nom — refus."
        )
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension non autorisee. Formats acceptes : {', '.join(sorted(ALLOWED_EXTENSIONS))}.",
        )
    return ext


def save_image_upload(
    file: UploadFile,
    *,
    target_dir: str,
    base_name: str | int,
) -> tuple[str, str]:
    """Valide et enregistre une image uploadee.

    - Verifie extension (whitelist)
    - Verifie taille (max 5 MB)
    - Verifie contenu via Pillow (rejette les fichiers qui ne sont pas
      vraiment des images, ex : .php renomme en .jpg, ou un .svg malicieux)
    - Reecrit l'extension a partir du format Pillow detecte (defense
      contre le mismatch extension/contenu)
    - Sauvegarde sous {target_dir}/{base_name}.{ext}
    - Renvoie (filepath_disque, public_url_relative)
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Fichier manquant.")

    # 1. Whitelist d'extension (sanity check rapide)
    _safe_extension(file.filename)

    # 2. Taille - lecture en memoire (limite a 5 MB)
    blob = file.file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if len(blob) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux. Limite : {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
        )
    if len(blob) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide.")

    # 3. Verification du contenu : Pillow refuse de reconnaitre les fichiers
    #    qui ne sont pas des images valides (ex : un .php renomme en .jpg).
    try:
        with Image.open(io.BytesIO(blob)) as img:
            img.verify()  # ne decode pas, juste verifie l'integrite
        # Re-open : verify() ferme l'image
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

    # 4. Determine l'extension finale a partir du format detecte (pas du nom)
    format_to_ext = {
        "JPEG": ".jpg",
        "PNG": ".png",
        "WEBP": ".webp",
        "GIF": ".gif",
    }
    ext = format_to_ext[pil_format]

    # 5. Sauvegarde
    os.makedirs(target_dir, exist_ok=True)
    filename = f"{base_name}{ext}"
    filepath = os.path.join(target_dir, filename)

    with open(filepath, "wb") as fh:
        fh.write(blob)

    # 6. Nettoyer les anciennes versions avec une autre extension
    #    (ex : on remplace 1.png par 1.webp -> on supprime 1.png)
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
