from fastapi import Request
from slowapi import Limiter

from .config import settings


def get_client_ip(request: Request) -> str:
    # Note: X-Forwarded-For is best-effort and can be spoofed if the upstream reverse proxy
    # is not configured to strip untrusted headers or overwrite X-Forwarded-For with the true client IP.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # First IP in the list is the originating client
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


limiter = Limiter(key_func=get_client_ip, enabled=settings.RATE_LIMIT_ENABLED)
