import os

from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

def setup_limiter(app):
    app.state.limiter = limiter
    if os.getenv("DISABLE_RATE_LIMITS", "0") == "1":
        limiter.enabled = False
        return
    app.add_middleware(SlowAPIMiddleware)