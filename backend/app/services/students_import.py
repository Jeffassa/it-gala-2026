"""Parse an Excel file (xlsx) and ingest ESATIC students into the directory."""
from __future__ import annotations

import io
import re

from openpyxl import load_workbook
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.student import Student


MATRICULE_RE = re.compile(r"^\d{2}-ESATIC\d{4}[A-Z]{2}$")


# Tolerant header mapping: Excel header (lowercased / accents stripped) -> internal field
HEADER_MAP = {
    "matricule": "matricule",
    "matricul": "matricule",
    "matr": "matricule",
    "matricule etudiant": "matricule",
    "nom": "full_name",
    "noms": "full_name",
    "nom complet": "full_name",
    "prenom et nom": "full_name",
    "nom et prenom": "full_name",
    "nom & prenom": "full_name",
    "etudiant": "full_name",
    "email": "email",
    "e-mail": "email",
    "mail": "email",
    "courriel": "email",
    "promotion": "promotion",
    "promo": "promotion",
    "classe": "promotion",
    "filiere": "promotion",
    "telephone": "phone",
    "tel": "phone",
    "phone": "phone",
    "tel.": "phone",
    "numero": "phone",
}


def _normalize_header(s: str) -> str:
    if s is None:
        return ""
    s = str(s).strip().lower()
    for a, b in [("é", "e"), ("è", "e"), ("ê", "e"), ("à", "a"), ("â", "a"), ("ô", "o"), ("ç", "c"), ("î", "i"), ("ï", "i"), ("ù", "u"), ("û", "u")]:
        s = s.replace(a, b)
    return s


def _stringify(v) -> str:
    if v is None:
        return ""
    if isinstance(v, str):
        return v.strip()
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def import_students_from_xlsx(db: Session, content: bytes, default_promotion: str | None = None) -> dict:
    """Parse an .xlsx and upsert students. Returns a stats dict.

    The first non-empty row that contains at least one known header is used as header row.
    Subsequent non-empty rows are treated as data.
    """
    wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    created = 0
    updated = 0
    skipped = 0
    errors: list[str] = []
    total = 0

    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue

        # find header row (first row that maps at least one column to matricule/full_name)
        header_idx = -1
        header_map: dict[int, str] = {}
        for ri, row in enumerate(rows[:10]):
            tentative: dict[int, str] = {}
            for ci, val in enumerate(row):
                key = HEADER_MAP.get(_normalize_header(_stringify(val)))
                if key:
                    tentative[ci] = key
            if {"matricule", "full_name"}.issubset(set(tentative.values())):
                header_idx = ri
                header_map = tentative
                break

        if header_idx == -1:
            errors.append(f"Feuille « {ws.title} » : entêtes 'matricule' et 'nom' introuvables. Ignorée.")
            continue

        for ri, row in enumerate(rows[header_idx + 1:], start=header_idx + 2):
            data: dict[str, str] = {field: "" for field in {"matricule", "full_name", "email", "promotion", "phone"}}
            for ci, field in header_map.items():
                if ci < len(row):
                    data[field] = _stringify(row[ci])

            # skip empty
            if not any(data.values()):
                continue
            total += 1

            matricule = data["matricule"].upper().replace(" ", "")
            if not matricule:
                skipped += 1
                errors.append(f"Ligne {ri} (feuille « {ws.title} ») : matricule manquant — ignorée.")
                continue
            if not MATRICULE_RE.match(matricule):
                skipped += 1
                errors.append(f"Ligne {ri} : matricule « {matricule} » invalide (format attendu AA-ESATIC####XX).")
                continue
            if not data["full_name"]:
                skipped += 1
                errors.append(f"Ligne {ri} : nom manquant pour {matricule}.")
                continue

            promotion = data["promotion"] or default_promotion or ws.title
            email = data["email"] or None
            phone = data["phone"] or None

            existing = db.scalar(select(Student).where(Student.matricule == matricule))
            if existing:
                existing.full_name = data["full_name"]
                existing.email = email
                existing.promotion = promotion
                existing.phone = phone
                updated += 1
            else:
                db.add(Student(
                    matricule=matricule,
                    full_name=data["full_name"],
                    email=email,
                    promotion=promotion,
                    phone=phone,
                ))
                created += 1

    db.commit()
    return {
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "errors": errors[:50],
        "total_rows": total,
    }
