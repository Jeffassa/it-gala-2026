# Déploiement IT Gala 2026 — Guide manuel

Stack de production : **Neon** (PostgreSQL) + **Render** (Backend + Frontend)
Coût total : **0 €** sur le tier gratuit.

## Architecture

```
Utilisateur ─┬─→ Frontend (Render Static)   https://it-gala.onrender.com
             │
             └─→ Backend (Render Web)       https://it-gala-api.onrender.com
                          │
                          └─→ PostgreSQL    (Neon.tech)
                          └─→ SMTP Gmail    (envoi emails)
```

## Étapes

### 1. Base PostgreSQL sur Neon

1. Va sur https://console.neon.tech (sign up gratuit avec GitHub)
2. Clique **"Create project"**
3. Région : **Europe (Frankfurt)** (la plus proche d'Abidjan)
4. Postgres version : 16
5. Copie la **Connection string** affichée (format : `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/dbname?sslmode=require`)
6. Adapte-la pour SQLAlchemy en remplaçant `postgresql://` par `postgresql+psycopg://`
7. Garde-la sous la main (tu vas la coller dans Render)

### 2. Backend sur Render

1. Va sur https://render.com → "Get Started" avec GitHub
2. Autorise Render à accéder à ton repo `it-gala-2026`
3. Clique **"+ New" → Web Service** → choisis le repo `Jeffassa/it-gala-2026`
4. Config :
   - **Name** : `it-gala-api`
   - **Root Directory** : `backend`
   - **Environment** : `Python 3`
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan** : Free
5. Section **Environment Variables**, clique "Advanced" puis "Add Environment Variable" :
   - `SECRET_KEY` = (générer 32 caractères aléatoires, voir plus bas)
   - `DATABASE_URL` = la connection string Neon (avec `postgresql+psycopg://`)
   - `CORS_ORIGINS` = `https://it-gala.onrender.com,https://it-gala-api.onrender.com`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `720`
   - `MAIL_FROM` = `assalendahjeanfrancois@gmail.com`
   - `MAIL_FROM_NAME` = `IT Gala 2026`
   - `MAIL_HOST` = `smtp.gmail.com`
   - `MAIL_PORT` = `587`
   - `MAIL_USERNAME` = `assalendahjeanfrancois@gmail.com`
   - `MAIL_PASSWORD` = ton app password Gmail (sans espaces)
   - `MAIL_TLS` = `true`
   - `MAIL_DEBUG` = `false`
6. Clique **"Create Web Service"**

Render va builder + lancer. Attends ~3-5 minutes. URL finale : `https://it-gala-api.onrender.com`

**Initialisation des données** : une fois le service en route, va dans l'onglet **"Shell"** du service Render et lance :
```
python -m app.seed
```
Cela crée le compte admin + la donnée de démo.

### 3. Frontend sur Render

1. Sur Render, clique **"+ New" → Static Site** → repo `Jeffassa/it-gala-2026`
2. Config :
   - **Name** : `it-gala`
   - **Root Directory** : `frontend`
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `dist`
3. Section **Environment Variables** :
   - `VITE_API_URL` = `https://it-gala-api.onrender.com/api/v1`
4. Section **Redirects/Rewrites** (très important pour React Router) :
   - Source : `/*`
   - Destination : `/index.html`
   - Action : `Rewrite`
5. Clique **"Create Static Site"**

URL finale : `https://it-gala.onrender.com`

### 4. Mise à jour du CORS backend (post-frontend)

Une fois le frontend déployé, retourne sur le service backend, change :
- `CORS_ORIGINS` = `https://it-gala.onrender.com` (l'URL exacte affichée par Render pour le static site)

Render redéploie automatiquement.

### 5. Test de bout en bout

1. Ouvre https://it-gala.onrender.com
2. Connecte-toi en admin (`admin@gala.it` / `admin1234` créé par le seed)
3. Vérifie que le dashboard charge correctement

---

## Génération du SECRET_KEY

Sur ton PC en PowerShell :
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```
Copie la sortie dans la variable d'env `SECRET_KEY` de Render.

## Mises à jour futures

À chaque `git push origin main` depuis ton PC, **Render redéploie automatiquement** le backend ET le frontend (auto-deploy activé par défaut).

```bash
cd C:\Users\hp\GalaITAwards2026
git add .
git commit -m "Mon changement"
git push
```

---

## Points d'attention

- **Cold start** : Render free tier endort le backend après 15 min sans trafic. Le réveil prend ~30 sec lors du prochain accès. Pour le jour J avec activité continue, ça ne pose pas de problème.
- **Limite Gmail** : 500 mails/jour avec un compte standard. Si tu dépasses (gros gala), bascule sur Brevo (300/jour gratuits, 10k pour 25 €/mois).
- **Domaine custom** : si tu veux `itgala.ci` au lieu de `it-gala.onrender.com`, achète le domaine (OVH, Namecheap, ~15 €/an), et configure-le dans Render → Settings → Custom Domains.
- **Backups DB** : Neon fait des snapshots automatiques sur le tier gratuit. Pour des sauvegardes manuelles : `pg_dump` depuis ton PC.
