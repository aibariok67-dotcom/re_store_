from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import games, categories, platforms, auth, reviews, uploads, admin, favorites

app = FastAPI(title="RE Store", version="0.2")

# Разрешаем запросы с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(games.router)
app.include_router(categories.router)
app.include_router(platforms.router)
app.include_router(auth.router)
app.include_router(reviews.router)
app.include_router(uploads.router)
app.include_router(admin.router)
app.include_router(favorites.router)