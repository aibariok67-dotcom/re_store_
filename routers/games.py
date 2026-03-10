from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from services import game_service
from schemas.game import GameResponse, GameCreate, GameUpdate

router = APIRouter(prefix="/games", tags=["Games"])

@router.get("/", response_model=list[GameResponse])
async def get_games(
    category_ids: list[int] = Query(default=[]),
    platform_ids: list[int] = Query(default=[]),
    db: AsyncSession = Depends(get_db)
):
    return await game_service.get_games(db, category_ids, platform_ids)

@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: int, db: AsyncSession = Depends(get_db)):
    return await game_service.get_game(db, game_id)

@router.post("/", response_model=GameResponse)
async def create_game(game: GameCreate, db: AsyncSession = Depends(get_db)):
    return await game_service.create_game(db, game)

@router.put("/{game_id}", response_model=GameResponse)
async def update_game(game_id: int, game: GameUpdate, db: AsyncSession = Depends(get_db)):
    return await game_service.update_game(db, game_id, game)

@router.delete("/{game_id}", response_model=GameResponse)
async def delete_game(game_id: int, db: AsyncSession = Depends(get_db)):
    return await game_service.delete_game(db, game_id)