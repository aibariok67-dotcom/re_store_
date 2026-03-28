from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, or_, select
from fastapi import HTTPException
from models.game import Game
from models.category import Category
from models.platform import Platform
from models.review import Review
from schemas.game import GameCreate, GamePatch, GameUpdate
from datetime import date

REVIEW_AVG_SUBQ = (
    select(Review.game_id, func.avg(Review.rating).label("reviews_rating_avg"))
    .group_by(Review.game_id)
    .subquery()
)


def parse_date(value: str, is_end: bool = False) -> date:
    if len(value) == 4:  # передали только год
        if is_end:
            return date(int(value), 12, 31)
        return date(int(value), 1, 1)
    return date.fromisoformat(value)  # передали полную дату 2012-01-01

async def get_games(db: AsyncSession, category_ids=None, platform_ids=None,
                    search=None, min_rating=None,
                    developer=None, publisher=None, release_date_from=None, release_date_to=None, page=1, limit=10, sort_by="id", order="asc"):
    category_ids = category_ids or []
    platform_ids = platform_ids or []

    query = (
        select(Game, REVIEW_AVG_SUBQ.c.reviews_rating_avg)
        .outerjoin(REVIEW_AVG_SUBQ, Game.id == REVIEW_AVG_SUBQ.c.game_id)
        .distinct()
    )

    if category_ids:
        for cat_id in category_ids:
            query = query.filter(Game.categories.any(Category.id == cat_id))
    if platform_ids:
        for plat_id in platform_ids:
            query = query.filter(Game.platforms.any(Platform.id == plat_id))
    if search:
        query = query.where(
            or_(
                Game.title.ilike(f"%{search}%"),
                Game.aliases.ilike(f"%{search}%")
            )
        )
    if min_rating is not None:
        query = query.where(Game.rating >= min_rating)
    if developer:
        query = query.where(Game.developer.ilike(f"%{developer}%"))
    if publisher:
        query = query.where(Game.publisher.ilike(f"%{publisher}%"))
    if release_date_from is not None:
        query = query.where(Game.release_date >= parse_date(release_date_from))
    if release_date_to is not None:
        query = query.where(Game.release_date <= parse_date(release_date_to, is_end=True))

    sort_fields = {
        "id": Game.id,
        "title": Game.title,
        "rating": Game.rating,
        "release_date": Game.release_date,
    }
    sort_column = sort_fields.get(sort_by, Game.id)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    rows = result.unique().all()
    out = []
    for row in rows:
        game = row[0]
        raw_avg = row[1]
        avg = round(float(raw_avg), 2) if raw_avg is not None else None
        out.append((game, avg))
    return out


async def _load_game(db: AsyncSession, game_id: int) -> Game:
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.unique().scalars().one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
    return game


async def _review_avg_for_game(db: AsyncSession, game_id: int) -> float | None:
    result = await db.execute(
        select(REVIEW_AVG_SUBQ.c.reviews_rating_avg).where(REVIEW_AVG_SUBQ.c.game_id == game_id)
    )
    raw = result.scalar_one_or_none()
    return round(float(raw), 2) if raw is not None else None


async def get_game_with_review_avg(db: AsyncSession, game_id: int) -> tuple[Game, float | None]:
    game = await _load_game(db, game_id)
    avg = await _review_avg_for_game(db, game_id)
    return game, avg


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
    game = await _load_game(db, game_id)

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

async def patch_game(db: AsyncSession, game_id: int, game_data: GamePatch):
    game = await _load_game(db, game_id)

    update_fields = game_data.model_dump(exclude_unset=True, exclude={"category_ids", "platform_ids"})
    for field, value in update_fields.items():
        setattr(game, field, value)

    if game_data.category_ids is not None:
        result = await db.execute(select(Category).where(Category.id.in_(game_data.category_ids)))
        game.categories = result.unique().scalars().all()

    if game_data.platform_ids is not None:
        result = await db.execute(select(Platform).where(Platform.id.in_(game_data.platform_ids)))
        game.platforms = result.unique().scalars().all()

    await db.commit()
    await db.refresh(game)
    return game

async def delete_game(db: AsyncSession, game_id: int):
    game = await _load_game(db, game_id)
    reviews_avg = await _review_avg_for_game(db, game_id)

    # Сначала удаляем все отзывы и избранное этой игры
    from models.review import Review
    from models.favorite import Favorite
    from sqlalchemy import delete
    
    await db.execute(delete(Review).where(Review.game_id == game_id))
    await db.execute(delete(Favorite).where(Favorite.game_id == game_id))
    
    await db.delete(game)
    await db.commit()
    return game, reviews_avg