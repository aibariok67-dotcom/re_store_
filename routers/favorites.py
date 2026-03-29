from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from core.logging_config import get_logger
from schemas.game import GameResponse, game_to_response
from services import favorite_service
from services.user_service import get_user_by_id

router = APIRouter(prefix="/favorites", tags=["Favorites"])
logger = get_logger(__name__)


@router.get("/", response_model=list[GameResponse])
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = await favorite_service.get_favorites_for_user(db, current_user.id)
    return [game_to_response(g, avg) for g, avg in rows]


@router.get("/user/{user_id}", response_model=list[GameResponse])
async def get_favorites_by_user_id(user_id: int, db: AsyncSession = Depends(get_db)):
    if await get_user_by_id(db, user_id) is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    rows = await favorite_service.get_favorites_for_user(db, user_id)
    return [game_to_response(g, avg) for g, avg in rows]


@router.post("/{game_id}")
async def add_favorite(
    game_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await favorite_service.add_favorite(db, current_user.id, game_id)
    logger.info(f"Избранное добавлено: user={current_user.username} game_id={game_id}")
    return {"detail": "Игра добавлена в избранное"}


@router.delete("/{game_id}")
async def remove_favorite(
    game_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await favorite_service.remove_favorite(db, current_user.id, game_id)
    logger.info(f"Избранное удалено: user={current_user.username} game_id={game_id}")
    return {"detail": "Игра убрана из избранного"}