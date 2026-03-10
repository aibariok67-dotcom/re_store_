from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers import games, categories, platforms
from core.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="RE Store", version="0.2", lifespan=lifespan)

app.include_router(games.router)
app.include_router(categories.router)
app.include_router(platforms.router)