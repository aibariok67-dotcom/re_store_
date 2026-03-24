from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_admin
from services import game_service
from schemas.game import GamePatch, GameResponse, GameCreate, GameUpdate
from core.logging_config import get_logger

router = APIRouter(prefix="/games", tags=["Games"])
logger = get_logger(__name__)

@router.get("/", response_model=list[GameResponse])
async def get_games(
    category_ids: list[int] = Query(default=[]),
    platform_ids: list[int] = Query(default=[]),
    search: str = Query(default=None),
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
        min_rating, developer, publisher,
        release_date_from, release_date_to,
        page, limit, sort_by, order
    )


@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: int, db: AsyncSession = Depends(get_db)):
    return await game_service.get_game(db, game_id)


@router.post("/", response_model=GameResponse)
async def create_game(
    game: GameCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    return await game_service.create_game(db, game)
    logger.info(f"Игра создана: {game.title} by={current_user.username}")




@router.put("/{game_id}", response_model=GameResponse)
async def update_game(
    game_id: int,
    game: GameUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    return await game_service.update_game(db, game_id, game)


@router.patch("/{game_id}", response_model=GameResponse)
async def patch_game(
    game_id: int,
    game: GamePatch,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    return await game_service.patch_game(db, game_id, game)


@router.delete("/{game_id}", response_model=GameResponse)
async def delete_game(
    game_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    return await game_service.delete_game(db, game_id)
    logger.info(f"Игра удалена: id={game_id} by={current_user.username}")
    