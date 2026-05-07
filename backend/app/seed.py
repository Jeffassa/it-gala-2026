"""Seed initial data: super admin + sample gala + categories + nominees.

Run: python -m app.seed
"""

from datetime import datetime

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.category import Category
from app.models.gala import Gala
from app.models.nominee import Nominee
from app.models.souvenir import Souvenir
from app.models.user import User, UserRole


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            db.add_all(
                [
                    User(
                        full_name="Super Admin",
                        email="admin@gala.it",
                        hashed_password=hash_password("admin1234"),
                        role=UserRole.SUPER_ADMIN,
                    ),
                    User(
                        full_name="Aïcha Touré",
                        email="caissiere@gala.it",
                        hashed_password=hash_password("caissiere1234"),
                        role=UserRole.CASHIER,
                    ),
                    User(
                        full_name="Yves N'Dri",
                        email="controleur@gala.it",
                        hashed_password=hash_password("controleur1234"),
                        role=UserRole.CONTROLLER,
                    ),
                    User(
                        full_name="Linda Yao",
                        email="participant@gala.it",
                        hashed_password=hash_password("participant1234"),
                        role=UserRole.PARTICIPANT,
                        school_promotion="L3 GLSI 2026",
                    ),
                ]
            )
            db.commit()

        if db.query(Gala).count() == 0:
            gala = Gala(
                name="IT Awards",
                edition_year=2026,
                theme="L'innovation au cœur de l'excellence",
                event_date=datetime(2026, 6, 6, 19, 0, 0),
                location="devinez",
                dress_code="Rouge bordeaux, or rosé et noir",
                program=(
                    "19h — Cocktail de bienvenue\n"
                    "20h — Cérémonie de remise des prix\n"
                    "22h — Dîner de gala\n"
                    "23h — Soirée dansante"
                ),
                tiktok_url="https://tiktok.com/esaticstudents",
                telegram_url="https://t.me/itawards",
                is_active=True,
                voting_open=True,
            )
            db.add(gala)
            db.commit()
            db.refresh(gala)

            categories_seed = [
                (
                    "Top 3 par filière",
                    "Les 3 premiers de chaque filière, par promotion.",
                    "trophy",
                    1,
                ),
                (
                    "Majors avec mention",
                    "Les majors de chaque filière ayant obtenu une moyenne ≥ 14, par promotion.",
                    "award",
                    2,
                ),
                (
                    "Meilleur club",
                    "Le club étudiant qui s'est le plus distingué cette année.",
                    "users",
                    3,
                ),
                (
                    "Meilleur projet étudiant",
                    "Le projet le plus innovant et impactant de l'année.",
                    "rocket",
                    4,
                ),
                (
                    "Meilleur professeur",
                    "Le professeur le plus apprécié, par promotion.",
                    "graduation-cap",
                    5,
                ),
                (
                    "Meilleur basketteur",
                    "Le talent du parquet, toutes promotions confondues.",
                    "star",
                    6,
                ),
                (
                    "Meilleur footballeur",
                    "La star du terrain, toutes promotions confondues.",
                    "star",
                    7,
                ),
                (
                    "Meilleur badeur",
                    "Celui ou celle qui anime toutes les soirées, par promotion.",
                    "sparkles",
                    8,
                ),
                (
                    "Meilleur délégué de classe",
                    "Le ou la représentant·e qui a le plus servi sa classe, par promotion.",
                    "vote",
                    9,
                ),
                (
                    "Meilleur président de promotion",
                    "La voix qui rassemble et qui inspire.",
                    "crown",
                    10,
                ),
                (
                    "Meilleur duo (couple)",
                    "Le couple le plus apprécié de l'école.",
                    "heart",
                    11,
                ),
                (
                    "Le/La plus faneur(se)",
                    "La star du charme, par promotion.",
                    "smile",
                    12,
                ),
                (
                    "Le/La plus sociable",
                    "Connaît tout le monde, par promotion.",
                    "users",
                    13,
                ),
            ]
            cats = []
            for name, desc, icon, idx in categories_seed:
                c = Category(
                    gala_id=gala.id,
                    name=name,
                    description=desc,
                    icon=icon,
                    order_index=idx,
                )
                db.add(c)
                cats.append(c)
            db.commit()
            for c in cats:
                db.refresh(c)

            # Nominés à ajouter via /admin/nominees (page dédiée).
            # Les catégories sont créées vides : l'admin uploadera les photos
            # et saisira les nominés via l'interface, par promotion / filière.
            sample_nominees: dict = {}
            bio_template = (
                "Acteur reconnu de la communauté tech, {name} s'est distingué(e) par son engagement, "
                "sa créativité et sa capacité à fédérer autour de projets ambitieux."
            )
            achievements_template = (
                "• Plusieurs projets open-source publiés\n"
                "• Conférences et meetups techniques\n"
                "• Mentorat auprès des juniors"
            )
            for cat in cats:
                for name, promo in sample_nominees.get(cat.name, []):
                    db.add(
                        Nominee(
                            category_id=cat.id,
                            name=name,
                            school_promotion=promo,
                            biography=bio_template.format(name=name),
                            achievements=achievements_template,
                        )
                    )
            db.commit()

            # Seed souvenirs
            if db.query(Souvenir).count() == 0:
                souvenirs_seed = [
                    ("Cérémonie d'ouverture", 0),
                    ("Remise des trophées", 1),
                    ("Performance live", 2),
                    ("Photos officielles", 3),
                    ("Soirée dansante", 4),
                ]
                for title, order in souvenirs_seed:
                    db.add(Souvenir(gala_id=gala.id, title=title, order=order))
                db.commit()

            print("[OK] Donnees de demonstration creees.")
        else:
            print("[--] Donnees deja presentes - seed ignore.")

        print("\nComptes de demo :")
        print("  admin@gala.it       / admin1234        (Super Admin)")
        print("  caissiere@gala.it   / caissiere1234    (Caissiere)")
        print("  controleur@gala.it  / controleur1234   (Controleur)")
        print("  participant@gala.it / participant1234  (Participant)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
