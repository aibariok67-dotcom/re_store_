from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.favorite import Favorite
from models.game import Game
from core.exceptions import GameNotFound, AlreadyFavorited, NotFound

async def add_favorite(db, user_id, game_id):
    result = await db.execute(select(Game).where(Game.id == game_id))
    if result.scalar_one_or_none() is None:
        raise GameNotFound()

    result = await db.execute(
        select(Favorite).where(Favorite.user_id == user_id, Favorite.game_id == game_id)
    )
    if result.scalar_one_or_none():
        raise AlreadyFavorited()

    favorite = Favorite(user_id=user_id, game_id=game_id)
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)
    return favorite

async def remove_favorite(db, user_id, game_id):
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == user_id, Favorite.game_id == game_id)
    )
    favorite = result.scalar_one_or_none()
    if favorite is None:
        raise NotFound("Запись избранного")
    await db.delete(favorite)
    await db.commit()
    return favorite


async def get_favorites(db: AsyncSession, user_id: int) -> list:
    """Все избранные игры юзера"""
    result = await db.execute(
        select(Game)
        .join(Favorite, Favorite.game_id == Game.id)
        .where(Favorite.user_id == user_id)
    )
    return result.unique().scalars().all()