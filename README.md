# Gala IT Awards 2026

Plateforme complète de gestion d'un gala de remise de prix tech : page d'accueil publique, vente de tickets avec QR, contrôle d'accès par scan, vote des nominés, et tableau de bord administrateur.

## Stack technique

- **Backend** : Python 3.12 · FastAPI · SQLAlchemy 2 · PostgreSQL 16 · JWT
- **Frontend** : React 18 · Vite · TypeScript · Tailwind CSS · React Router · Zustand
- **Infra** : Docker Compose (Postgres)
- **QR codes** : `qrcode` (génération) + `html5-qrcode` (scan caméra)

## Rôles & interfaces

| Rôle | Interface | Fonctionnalités |
|---|---|---|
| **Public** | Page d'accueil (`/`) | Hero, archive 2025, infos gala 2026, catégories des IT Awards |
| **Super Admin** | `/admin` | Galas, catégories, nominés, tickets, utilisateurs, rapports |
| **Caissière** | `/cashier` | Vente de tickets (solo / couple / groupe), génération QR, recherche acheteurs |
| **Contrôleur** | `/controller` | Scan QR caméra, validation tickets, statistiques live |
| **Participant** | `/me` + `/me/vote` | Espace de vote, salle de vote par catégories |

## Démarrage rapide

### 1. Lancer PostgreSQL

```bash
docker compose up -d
```

PostgreSQL écoute sur `localhost:5432` (db `gala`, user `gala`, password `gala`).

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Initialiser la DB et créer les comptes de démo + données d'exemple
python -m app.seed

# Lancer l'API
uvicorn app.main:app --reload
```

API disponible sur **http://localhost:8000** (docs interactives : `/docs`).

### 3. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible sur **http://localhost:5173**.

## Comptes de démonstration

Après `python -m app.seed`, ces comptes sont créés :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@gala.it` | `admin1234` | Super Admin |
| `caissiere@gala.it` | `caissiere1234` | Caissière |
| `controleur@gala.it` | `controleur1234` | Contrôleur |
| `participant@gala.it` | `participant1234` | Participant |

Le seed crée également l'édition **IT Awards 2026** avec 6 catégories et leurs nominés d'exemple.

## Architecture

```
GalaITAwards2026/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # routes (auth, galas, tickets, votes, scans, …)
│   │   ├── core/          # config, db, security, deps
│   │   ├── models/        # SQLAlchemy
│   │   ├── schemas/       # Pydantic
│   │   ├── main.py        # entrée FastAPI
│   │   └── seed.py        # données initiales
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/    # UI partagée (Modal, Avatar, Toast, TicketQR…)
│       ├── lib/           # api client, types, format
│       ├── pages/
│       │   ├── Home.tsx           # page d'accueil publique
│       │   ├── Login.tsx          # connexion + inscription
│       │   ├── admin/             # dashboard, galas, catégories, nominés, tickets, users, reports
│       │   ├── cashier/           # vente de tickets + QR
│       │   ├── controller/        # scan QR via caméra
│       │   └── participant/       # espace + salle de vote
│       └── store/         # Zustand (auth, toast)
├── docker-compose.yml     # PostgreSQL 16
└── README.md
```

## Points clés

- **Auth JWT** avec rôles (`super_admin`, `cashier`, `controller`, `participant`).
- **Tickets** générés avec un code unique `GIA-XXXXXX` et un QR scannable.
- **Vote unique par catégorie** (peut être modifié, pas dupliqué).
- **Scan caméra** via `html5-qrcode` (nécessite HTTPS en production ou `localhost`).
- **Statut acheteur** : `regular` / `esoteric` (tarif spécial).
- **Tarifs configurables** côté caisse (table `PRICE_TABLE` dans `Cashier.tsx`).

## Endpoints principaux

| Méthode | Endpoint | Auth |
|---|---|---|
| `POST` | `/api/v1/auth/login` | — |
| `POST` | `/api/v1/auth/register` | — (participant) |
| `GET`  | `/api/v1/galas/active` | — |
| `GET`  | `/api/v1/categories?gala_id=` | — |
| `GET`  | `/api/v1/nominees?category_id=` | — |
| `POST` | `/api/v1/tickets` | Caissière |
| `POST` | `/api/v1/scans/{code}` | Contrôleur |
| `POST` | `/api/v1/votes` | Participant |
| `GET`  | `/api/v1/reports/full` | Admin |

Documentation interactive complète : http://localhost:8000/docs

## Production

- Définir `SECRET_KEY` (`openssl rand -hex 32`)
- Servir le frontend buildé (`npm run build` → `frontend/dist`) derrière un reverse proxy (Caddy / nginx)
- Activer HTTPS (requis pour `getUserMedia` / scan caméra)
- Configurer `CORS_ORIGINS` côté backend
- Migrer Postgres avec Alembic (déjà en dépendance)
