from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import games, categories, platforms, auth, reviews, uploads, admin

app = FastAPI(title="RE Store", version="0.2")


app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(games.router)
app.include_router(categories.router)
app.include_router(platforms.router)
app.include_router(auth.router)
app.include_router(reviews.router)
app.include_router(uploads.router)
app.include_router(admin.router)