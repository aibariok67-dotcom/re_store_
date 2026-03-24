from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from core.limiter import limiter, setup_limiter
from slowapi.errors import RateLimitExceeded

from core.logging_config import setup_logging, get_logger
from core.exceptions import AppException
from routers import games, categories, platforms, auth, reviews, uploads, admin, favorites


setup_logging()
logger = get_logger(__name__)
app = FastAPI(title="RE Store", version="0.3")
setup_limiter(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Красивый ответ при превышении лимита запросов."""
    logger.warning(f"Rate limit exceeded: {request.client.host} → {request.url.path}")
    return JSONResponse(
        status_code=429,
        content={"detail": "Слишком много запросов. Подождите немного."},
    )

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Перехватывает все наши кастомные ошибки и логирует их."""
   
    if exc.status_code >= 500:
        logger.error(f"{request.method} {request.url.path} → {exc.status_code}: {exc.detail}")
    else:
        logger.warning(f"{request.method} {request.url.path} → {exc.status_code}: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Ловит любые необработанные исключения — логирует и возвращает 500."""
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


@app.on_event("startup")
async def startup():
    logger.info("RE Store запущен ✓")

@app.on_event("shutdown")
async def shutdown():
    logger.info("RE Store остановлен")