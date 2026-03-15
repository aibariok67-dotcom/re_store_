from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from services import game_service
from schemas.game import GamePatch, GameResponse, GameCreate, GameUpdate


router = APIRouter(prefix="/games", tags=["Games"])

@router.get("/", response_model=list[GameResponse])
async def get_games(
    category_ids: list[int] = Query(default=[]),
    platform_ids: list[int] = Query(default=[]),
    search: str = Query(default=None),
    min_price: float = Query(default=None),
    max_price: float = Query(default=None),
    min_rating: float = Query(default=None),
    developer: str = Query(default=None),
    publisher: str = Query(default=None),
    release_date_from: str = Query(default=None),
    release_date_to: str = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    sort_by: str = Query(default="id"),
    order: str = Query(default="asc"),
    db: AsyncSession = Depends(get_db)
):
    return await game_service.get_games(
        db, category_ids, platform_ids, search, 
        min_price, max_price, min_rating,
        developer, publisher, release_date_from, release_date_to,
        page, limit, sort_by, order
    )

@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: int, db: AsyncSession = Depends(get_db)):
    return await game_service.get_game(db, game_id)

@router.post("/", response_model=GameResponse)
async def create_game(game: GameCreate, db: AsyncSession = Depends(get_db)):
    return await game_service.create_game(db, game)

@router.put("/{game_id}", response_model=GameResponse)
async def update_game(game_id: int, game: GameUpdate, db: AsyncSession = Depends(get_db)):
    return await game_service.update_game(db, game_id, game)

@router.patch("/{game_id}", response_model=GameResponse)
async def patch_game(game_id: int, game: GamePatch, db: AsyncSession = Depends(get_db)):
    return await game_service.patch_game(db, game_id, game)

@router.delete("/{game_id}", response_model=GameResponse)
async def delete_game(game_id: int, db: AsyncSession = Depends(get_db)):
    return await game_service.delete_game(db, game_id)