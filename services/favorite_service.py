from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.db_integrity import is_unique_violation
from models.favorite import Favorite
from models.game import Game
from core.exceptions import GameNotFound, AlreadyFavorited, NotFound
from services.game_service import REVIEW_AVG_SUBQ

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
    try:
        await db.commit()
        await db.refresh(favorite)
    except IntegrityError as e:
        await db.rollback()
        if not is_unique_violation(e):
            raise
        raise AlreadyFavorited() from e
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


async def get_favorites_for_user(db: AsyncSession, user_id: int) -> list[tuple[Game, float | None]]:
    result = await db.execute(
        select(Game, REVIEW_AVG_SUBQ.c.reviews_rating_avg)
        .join(Favorite, Favorite.game_id == Game.id)
        .outerjoin(REVIEW_AVG_SUBQ, Game.id == REVIEW_AVG_SUBQ.c.game_id)
        .where(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
    )
    rows = result.unique().all()
    out: list[tuple[Game, float | None]] = []
    for row in rows:
        game, raw_avg = row[0], row[1]
        avg = round(float(raw_avg), 2) if raw_avg is not None else None
        out.append((game, avg))
    return out