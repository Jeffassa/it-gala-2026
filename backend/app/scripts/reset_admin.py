"""Reset le compte super_admin aux credentials canoniques.

⚠️ Action a executer UNE FOIS :
- Sur la prod Render : via le Shell du service
- Sur un autre environnement : via le terminal local

Apres execution, le super_admin a :
    email    = admin@gala.it
    password = admin1234
    actif    = True

Si un autre super_admin existe (peu probable), il est laisse intact.
Le script ne touche que le PREMIER super_admin trouve (ordre par id).

Usage :
    python -m app.scripts.reset_admin
"""

from __future__ import annotations

import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole

CANONICAL_EMAIL = "admin@gala.it"
CANONICAL_PASSWORD = "admin1234"


def reset_admin() -> int:
    db = SessionLocal()
    try:
        admin = db.scalar(
            select(User).where(User.role == UserRole.SUPER_ADMIN).order_by(User.id)
        )
        if admin is None:
            # Pas d'admin du tout : on en cree un.
            admin = User(
                full_name="Super Admin",
                email=CANONICAL_EMAIL,
                hashed_password=hash_password(CANONICAL_PASSWORD),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"[CREE] Aucun super_admin n'existait — un nouveau a ete cree :")
            print(f"       id={admin.id}  email={admin.email}  password={CANONICAL_PASSWORD}")
            return 0

        # Reset
        old_email = admin.email
        admin.email = CANONICAL_EMAIL
        admin.hashed_password = hash_password(CANONICAL_PASSWORD)
        admin.is_active = True
        db.commit()

        print(f"[RESET] super_admin id={admin.id} reinitialise :")
        print(f"        ancien email : {old_email}")
        print(f"        nouvel email : {admin.email}")
        print(f"        password     : {CANONICAL_PASSWORD}")
        print(f"        is_active    : {admin.is_active}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(reset_admin())
