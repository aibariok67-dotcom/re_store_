from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from models.game import Game
from models.category import Category
from models.platform import Platform
from schemas.game import GameCreate, GameUpdate
from datetime import date

def parse_date(value: str, is_end: bool = False) -> date:
    if len(value) == 4:  # передали только год
        if is_end:
            return date(int(value), 12, 31)
        return date(int(value), 1, 1)
    return date.fromisoformat(value)  # передали полную дату 2012-01-01

async def get_games(db: AsyncSession, category_ids=None, platform_ids=None,
                    search=None, min_price=None, max_price=None, min_rating=None,
                    developer=None, release_date_from=None, release_date_to=None):
    category_ids = category_ids or []
    platform_ids = platform_ids or []

    query = select(Game).distinct()

    if category_ids:
        query = query.join(Game.categories).where(Category.id.in_(category_ids))
    if platform_ids:
        query = query.join(Game.platforms).where(Platform.id.in_(platform_ids))
    if search:
        query = query.where(Game.title.ilike(f"%{search}%"))
    if min_price is not None:
        query = query.where(Game.price >= min_price)
    if max_price is not None:
        query = query.where(Game.price <= max_price)
    if min_rating is not None:
        query = query.where(Game.rating >= min_rating)
    if developer:
        query = query.where(Game.developer.ilike(f"%{developer}%"))
    if release_date_from is not None:
        query = query.where(Game.release_date >= parse_date(release_date_from))
    if release_date_to is not None:
        query = query.where(Game.release_date <= parse_date(release_date_to, is_end=True))

    result = await db.execute(query)
    return result.unique().scalars().all()

async def get_game(db: AsyncSession, game_id: int):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.unique().scalars().one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
    return game


async def _resolve_relations(db: AsyncSession, category_ids: list[int], platform_ids: list[int]):
    """Load Category and Platform ORM objects by their IDs."""
    categories = []
    if category_ids:
        result = await db.execute(select(Category).where(Category.id.in_(category_ids)))
        categories = result.unique().scalars().all()
        if len(categories) != len(category_ids):
            raise HTTPException(status_code=400, detail="One or more category IDs not found")

    platforms = []
    if platform_ids:
        result = await db.execute(select(Platform).where(Platform.id.in_(platform_ids)))
        platforms = result.unique().scalars().all()
        if len(platforms) != len(platform_ids):
            raise HTTPException(status_code=400, detail="One or more platform IDs not found")

    return categories, platforms


async def create_game(db: AsyncSession, game: GameCreate):
    category_ids = game.category_ids or []
    platform_ids = game.platform_ids or []

    game_data = game.model_dump(exclude={"category_ids", "platform_ids"})
    new_game = Game(**game_data)

    categories, platforms = await _resolve_relations(db, category_ids, platform_ids)
    new_game.categories = categories
    new_game.platforms = platforms

    db.add(new_game)
    await db.commit()
    await db.refresh(new_game)
    return new_game


async def update_game(db: AsyncSession, game_id: int, game_data: GameUpdate):
    game = await get_game(db, game_id)

    category_ids = game_data.category_ids or []
    platform_ids = game_data.platform_ids or []

    for field, value in game_data.model_dump(exclude={"category_ids", "platform_ids"}).items():
        setattr(game, field, value)

    categories, platforms = await _resolve_relations(db, category_ids, platform_ids)
    game.categories = categories
    game.platforms = platforms

    await db.commit()
    await db.refresh(game)
    return game


async def delete_game(db: AsyncSession, game_id: int):
    game = await get_game(db, game_id)
    await db.delete(game)
    await db.commit()
    return game