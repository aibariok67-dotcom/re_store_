from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.review import Review
from schemas.review import ReviewCreate
from core.exceptions import ReviewNotFound, AlreadyReviewed, PermissionDenied

async def get_reviews_by_game(db: AsyncSession, game_id: int) -> list:
    from models.user import User
    result = await db.execute(
        select(Review, User.username, User.avatar_url, User.is_premium, User.premium_theme)
        .join(User, User.id == Review.user_id)
        .where(Review.game_id == game_id)
    )
    rows = result.all()
    
    reviews = []
    for review, username, avatar_url, is_premium, premium_theme in rows:
        reviews.append({
            "id": review.id,
            "user_id": review.user_id,
            "username": username,
            "avatar_url": avatar_url, 
            "game_id": review.game_id,
            "rating": review.rating,
            "text": review.text,
            "image_url": review.image_url,
            "created_at": review.created_at,
            "is_premium": is_premium,
            "premium_theme": premium_theme,
        })
    return reviews

async def get_review(db: AsyncSession, review_id: int) -> Review | None:
    result = await db.execute(select(Review).where(Review.id == review_id))
    return result.scalar_one_or_none()

async def check_existing_review(db: AsyncSession, user_id: int, game_id: int):
    existing = await db.execute(
        select(Review).where(Review.user_id == user_id, Review.game_id == game_id)
    )
    if existing.scalar_one_or_none():
        raise AlreadyReviewed()

async def create_review(db: AsyncSession, data: ReviewCreate, user_id: int) -> Review:
    await check_existing_review(db, user_id, data.game_id)
    review = Review(
        user_id=user_id,
        game_id=data.game_id,
        rating=data.rating,
        text=data.text,
        image_url=data.image_url
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review

async def delete_review(db: AsyncSession, review_id: int, user_id: int, is_admin: bool):
    review = await get_review(db, review_id)
    if review is None:
        raise ReviewNotFound()
    if not is_admin and review.user_id != user_id:
        raise PermissionDenied("Нет прав для удаления этого отзыва")
    await db.delete(review)
    await db.commit()
    return review

async def get_reviews_by_user(db: AsyncSession, user_id: int) -> list:
    from models.game import Game

    result = await db.execute(
        select(Review, Game.title, Game.image_url)
        .join(Game, Game.id == Review.game_id)
        .where(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "game_id": r.game_id,
            "game_title": title,
            "game_image_url": game_image,
            "rating": r.rating,
            "text": r.text,
            "image_url": r.image_url,
            "created_at": r.created_at,
        }
        for r, title, game_image in rows
    ]