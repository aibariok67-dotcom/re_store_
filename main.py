from fastapi import FastAPI
from routers import games, categories, platforms

app = FastAPI(title="RE Store", version="0.2")

app.include_router(games.router)
app.include_router(categories.router)
app.include_router(platforms.router)