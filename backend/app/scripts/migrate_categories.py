"""Remplace les categories existantes par les 13 categories officielles IT Awards.

⚠️ ATTENTION : ce script supprime TOUTES les categories du gala actif et les
nominees/votes attaches (cascade). Les billets et utilisateurs ne sont pas
touches.

Usage :
    python -m app.scripts.migrate_categories

A executer une seule fois apres deploiement du nouveau code.
"""
from __future__ import annotations

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.category import Category
from app.models.gala import Gala
from app.models.nominee import Nominee
from app.models.vote import Vote


CATEGORIES_OFFICIELLES = [
    ("Top 3 par filière", "Les 3 premiers de chaque filière, par promotion.", "trophy", 1),
    ("Majors avec mention", "Les majors de chaque filière ayant obtenu une moyenne ≥ 14, par promotion.", "award", 2),
    ("Meilleur club", "Le club étudiant qui s'est le plus distingué cette année.", "users", 3),
    ("Meilleur projet étudiant", "Le projet le plus innovant et impactant de l'année.", "rocket", 4),
    ("Meilleur professeur", "Le professeur le plus apprécié, par promotion.", "graduation-cap", 5),
    ("Meilleur basketteur", "Le talent du parquet, toutes promotions confondues.", "star", 6),
    ("Meilleur footballeur", "La star du terrain, toutes promotions confondues.", "star", 7),
    ("Meilleur badeur", "Celui ou celle qui anime toutes les soirées, par promotion.", "sparkles", 8),
    ("Meilleur délégué de classe", "Le ou la représentant·e qui a le plus servi sa classe, par promotion.", "vote", 9),
    ("Meilleur président de promotion", "La voix qui rassemble et qui inspire.", "crown", 10),
    ("Meilleur duo (couple)", "Le couple le plus apprécié de l'école.", "heart", 11),
    ("Le/La plus faneur(se)", "La star du charme, par promotion.", "smile", 12),
    ("Le/La plus sociable", "Connaît tout le monde, par promotion.", "users", 13),
]


def migrate() -> None:
    db = SessionLocal()
    try:
        # 1. Recuperer le gala actif (sinon, le 1er gala)
        gala = db.scalar(select(Gala).where(Gala.is_active.is_(True)))
        if gala is None:
            gala = db.scalar(select(Gala).order_by(Gala.id))
        if gala is None:
            print("[ABORT] Aucun gala dans la base. Lance d'abord : python -m app.seed")
            return

        print(f"[INFO] Gala cible : #{gala.id} '{gala.name}' (edition {gala.edition_year})")

        # 2. Statistiques avant
        existing = db.scalars(select(Category).where(Category.gala_id == gala.id)).all()
        nominee_count = db.scalar(
            select(Nominee).join(Category).where(Category.gala_id == gala.id)
        )
        vote_count = db.scalar(
            select(Vote).join(Category).where(Category.gala_id == gala.id)
        )
        print(f"[INFO] Categories actuelles  : {len(existing)}")
        print(f"[INFO] Nominees a supprimer  : {nominee_count or 0}")
        print(f"[INFO] Votes a supprimer     : {vote_count or 0}")

        # 3. Confirmation
        ans = input("\nProceder a la migration ? (oui/non) : ").strip().lower()
        if ans not in ("oui", "o", "yes", "y"):
            print("Annule.")
            return

        # 4. Suppression cascade : votes -> nominees -> categories
        for cat in existing:
            for nom in db.scalars(select(Nominee).where(Nominee.category_id == cat.id)).all():
                # supprimer les votes lies au nominee
                for v in db.scalars(select(Vote).where(Vote.nominee_id == nom.id)).all():
                    db.delete(v)
                db.delete(nom)
            db.delete(cat)
        db.commit()
        print(f"[OK] {len(existing)} ancienne(s) categorie(s) supprimee(s).")

        # 5. Insertion des 13 nouvelles
        for name, desc, icon, idx in CATEGORIES_OFFICIELLES:
            db.add(Category(gala_id=gala.id, name=name, description=desc, icon=icon, order_index=idx))
        db.commit()
        print(f"[OK] {len(CATEGORIES_OFFICIELLES)} nouvelles categories inserees.")

        # 6. Verification
        new_cats = db.scalars(
            select(Category).where(Category.gala_id == gala.id).order_by(Category.order_index)
        ).all()
        print("\n--- Categories en base apres migration ---")
        for c in new_cats:
            print(f"  {c.order_index:2}. {c.name}  [icon: {c.icon}]")

    finally:
        db.close()


if __name__ == "__main__":
    migrate()
