"""Seed initial data: super admin + sample gala + categories + nominees.

Run: python -m app.seed
"""
from datetime import datetime

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.category import Category
from app.models.gala import Gala
from app.models.nominee import Nominee
from app.models.user import User, UserRole


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            db.add_all([
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
            ])
            db.commit()

        if db.query(Gala).count() == 0:
            gala = Gala(
                name="IT Awards",
                edition_year=2026,
                theme="L'innovation au cœur de l'excellence",
                event_date=datetime(2026, 6, 6, 19, 0, 0),
                location="Palais de la Culture, Abidjan",
                dress_code="Tenue de soirée — Black Tie",
                program=(
                    "19h — Cocktail de bienvenue\n"
                    "20h — Cérémonie de remise des prix\n"
                    "22h — Dîner de gala\n"
                    "23h — Soirée dansante"
                ),
                tiktok_url="https://tiktok.com/@itawards",
                telegram_url="https://t.me/itawards",
                is_active=True,
                voting_open=True,
            )
            db.add(gala)
            db.commit()
            db.refresh(gala)

            categories_seed = [
                ("Meilleur Étudiant", "L'étudiant qui s'est démarqué cette année par son excellence académique et son engagement.", "graduation-cap", 1),
                ("Meilleur Couple", "Le couple le plus apprécié de la promotion, alliant complicité et inspiration.", "heart", 2),
                ("Meilleur Sourire", "Celui ou celle dont le sourire illumine le campus et réchauffe les cœurs.", "smile", 3),
                ("Meilleur Projet IT", "Le projet technologique le plus innovant et impactant de l'année.", "rocket", 4),
                ("Meilleur Influenceur Tech", "La voix tech la plus suivie et la plus inspirante de la communauté.", "smartphone", 5),
                ("Coup de Cœur du Jury", "Une personnalité qui a marqué l'année par sa créativité et son engagement.", "gem", 6),
            ]
            cats = []
            for name, desc, icon, idx in categories_seed:
                c = Category(gala_id=gala.id, name=name, description=desc, icon=icon, order_index=idx)
                db.add(c)
                cats.append(c)
            db.commit()
            for c in cats:
                db.refresh(c)

            sample_nominees = {
                "Meilleur Étudiant": [
                    ("Aïcha Koné", "L3 GLSI 2026"),
                    ("Yves N'Dri", "M1 SIRI 2026"),
                    ("Fatou Diallo", "L3 GLSI 2026"),
                    ("Kouadio Ange", "M2 BDIA 2026"),
                ],
                "Meilleur Couple": [
                    ("Marc & Laure", "L3 GLSI 2026"),
                    ("Sékou & Awa", "M1 SIRI 2026"),
                    ("Olivier & Mariam", "L3 RTEL 2026"),
                ],
                "Meilleur Sourire": [
                    ("Kady Touré", "L2 INFO 2026"),
                    ("Boris Kouamé", "L3 GLSI 2026"),
                    ("Linda Yao", "M1 SIRI 2026"),
                ],
                "Meilleur Projet IT": [
                    ("EduMatch — IA d'orientation", "L3 GLSI 2026"),
                    ("AgriScan — Vision artificielle", "M2 BDIA 2026"),
                    ("CivicVote — eGov", "M1 SIRI 2026"),
                ],
                "Meilleur Influenceur Tech": [
                    ("@dev_aboubakar", "Alumni"),
                    ("@codeuse_civ", "L3 GLSI 2026"),
                    ("@tech_aida", "M1 SIRI 2026"),
                ],
                "Coup de Cœur du Jury": [
                    ("Club Robotique ESATIC", "Tous niveaux"),
                    ("Hackathon GreenTech", "Cross-promo 2026"),
                ],
            }
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
                    db.add(Nominee(
                        category_id=cat.id, name=name, school_promotion=promo,
                        biography=bio_template.format(name=name),
                        achievements=achievements_template,
                    ))
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
