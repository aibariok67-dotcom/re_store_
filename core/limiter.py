from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

def setup_limiter(app):
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)