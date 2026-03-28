from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from slowapi.errors import RateLimitExceeded

from core.limiter import setup_limiter
from core.logging_config import setup_logging, get_logger
from core.exceptions import AppException
from core.config import settings
from routers import games, categories, platforms, auth, reviews, uploads, admin, favorites, premium


setup_logging()
logger = get_logger(__name__)

app = FastAPI(title="RE Store", version="0.3")
setup_limiter(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate limit exceeded: {request.client.host} → {request.url.path}")
    return JSONResponse(
        status_code=429,
        content={"detail": "Слишком много запросов. Подождите немного."},
    )


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    if exc.status_code >= 500:
        logger.error(f"{request.method} {request.url.path} → {exc.status_code}: {exc.detail}")
    else:
        logger.warning(f"{request.method} {request.url.path} → {exc.status_code}: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Необработанная ошибка: {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера"},
    )


app.include_router(games.router)
app.include_router(categories.router)
app.include_router(platforms.router)
app.include_router(auth.router)
app.include_router(reviews.router)
app.include_router(uploads.router)
app.include_router(admin.router)
app.include_router(favorites.router)
app.include_router(premium.router)

# Mount AFTER routers so POST /uploads/image is handled by the router first
import os as _os
_os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.on_event("startup")
async def startup():
    logger.info("RE Store запущен ✓")


@app.on_event("shutdown")
async def shutdown():
    logger.info("RE Store остановлен")


@app.get("/health")
async def health():
    return {"status": "ok"}