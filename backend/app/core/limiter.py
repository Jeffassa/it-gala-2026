"""Rate limiter partage (slowapi).

Utilise l'IP du client comme cle. En production derriere un reverse proxy
(Nginx, Cloudflare, Render), pense a propager le header X-Forwarded-For
ou utilise ProxyHeadersMiddleware d'uvicorn (active par defaut).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Storage en memoire : suffisant pour un seul process backend.
# Pour scaler horizontalement, passer a un storage Redis : storage_uri="redis://..."
limiter = Limiter(key_func=get_remote_address, default_limits=[])
