from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from schemas.game import GameResponse
from services import favorite_service

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("/", response_model=list[GameResponse])
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Мои избранные игры"""
    return await favorite_service.get_favorites(db, current_user.id)


@router.post("/{game_id}")
async def add_favorite(
    game_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Добавить игру в избранное"""
    try:
        await favorite_service.add_favorite(db, current_user.id, game_id)
        return {"detail": "Игра добавлена в избранное"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{game_id}")
async def remove_favorite(
    game_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Убрать игру из избранного"""
    try:
        await favorite_service.remove_favorite(db, current_user.id, game_id)
        return {"detail": "Игра убрана из избранного"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))