from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.review import Review
from schemas.review import ReviewCreate, ReviewCreateAdmin


async def get_reviews_by_game(db: AsyncSession, game_id: int) -> list[Review]:
    """Все отзывы на конкретную игру"""
    result = await db.execute(
        select(Review).where(Review.game_id == game_id)
    )
    return result.scalars().all()


async def get_review(db: AsyncSession, review_id: int) -> Review | None:
    """Один отзыв по id"""
    result = await db.execute(select(Review).where(Review.id == review_id))
    return result.scalar_one_or_none()


async def check_existing_review(db: AsyncSession, user_id: int, game_id: int):
    """Проверяем что юзер ещё не писал отзыв на эту игру"""
    existing = await db.execute(
        select(Review).where(
            Review.user_id == user_id,
            Review.game_id == game_id
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Вы уже оставили отзыв на эту игру")


async def create_user_review(
    db: AsyncSession,
    data: ReviewCreate,
    user_id: int
) -> Review:
    """Создать бесплатный отзыв — для обычного юзера"""
    await check_existing_review(db, user_id, data.game_id)

    review = Review(
        user_id=user_id,
        game_id=data.game_id,
        rating=data.rating,
        text=data.text,
        image_url=data.image_url,
        is_paid=False,
        price=None,
    )

    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def create_admin_review(
    db: AsyncSession,
    data: ReviewCreateAdmin,
    user_id: int
) -> Review:
    """Создать платный отзыв — только для админа"""
    await check_existing_review(db, user_id, data.game_id)

    review = Review(
        user_id=user_id,
        game_id=data.game_id,
        rating=data.rating,
        text=data.text,
        image_url=data.image_url,
        is_paid=data.is_paid,
        price=data.price,
    )

    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def delete_review(
    db: AsyncSession,
    review_id: int,
    user_id: int,
    is_admin: bool
) -> Review:
    """Удалить отзыв — автор или админ"""
    review = await get_review(db, review_id)

    if review is None:
        raise ValueError("Отзыв не найден")

    if not is_admin and review.user_id != user_id:
        raise ValueError("Нет прав для удаления этого отзыва")

    await db.delete(review)
    await db.commit()
    return review