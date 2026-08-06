"""Central rate limiter instance (breaks circular imports with routers)."""

from fastapi import Request
from slowapi import Limiter


def _client_ip(request: Request) -> str:
    """Client IP honoring X-Forwarded-For (backend sits behind nginx/Caddy).

    Uses the leftmost address appended by the proxy. Direct clients could spoof
    the header, so the reverse proxy must overwrite X-Forwarded-For
    (nginx/Caddy default behavior).
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_client_ip)
