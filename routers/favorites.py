from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from core.logging_config import get_logger
from schemas.game import GameResponse
from services import favorite_service

router = APIRouter(prefix="/favorites", tags=["Favorites"])
logger = get_logger(__name__)


@router.get("/", response_model=list[GameResponse])
async def get_favorites(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await favorite_service.get_favorites(db, current_user.id)


@router.post("/{game_id}")
async def add_favorite(game_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await favorite_service.add_favorite(db, current_user.id, game_id)
    logger.info(f"Избранное добавлено: user={current_user.username} game_id={game_id}")
    return {"detail": "Игра добавлена в избранное"}


@router.delete("/{game_id}")
async def remove_favorite(game_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await favorite_service.remove_favorite(db, current_user.id, game_id)
    logger.info(f"Избранное удалено: user={current_user.username} game_id={game_id}")
    return {"detail": "Игра убрана из избранного"}