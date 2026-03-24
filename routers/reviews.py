from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user, get_current_admin
from core.exceptions import ReviewNotFound
from core.limiter import limiter
from core.logging_config import get_logger
from schemas.review import ReviewCreate, ReviewCreateAdmin, ReviewResponse
from services import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])
logger = get_logger(__name__)


@router.get("/game/{game_id}")
async def get_reviews_by_game(game_id: int, db: AsyncSession = Depends(get_db)):
    return await review_service.get_reviews_by_game(db, game_id)


@router.get("/my")
async def get_my_reviews(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await review_service.get_my_reviews(db, current_user.id)


@router.get("/user/{user_id}")
async def get_reviews_by_user(user_id: int, db: AsyncSession = Depends(get_db)):
    return await review_service.get_reviews_by_user(db, user_id)


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    review = await review_service.get_review(db, review_id)
    if review is None:
        raise ReviewNotFound()
    return review


@router.post("/", response_model=ReviewResponse)
@limiter.limit("10/hour")  # не больше 10 отзывов в час с одного IP
async def create_user_review(
    request: Request,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    review = await review_service.create_user_review(db, data, current_user.id)
    logger.info(f"Новый отзыв: user={current_user.username} game_id={data.game_id}")
    return review


@router.post("/admin", response_model=ReviewResponse)
async def create_admin_review(
    request: Request,
    data: ReviewCreateAdmin,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    review = await review_service.create_admin_review(db, data, current_user.id)
    logger.info(f"Платный отзыв (админ): user={current_user.username} game_id={data.game_id}")
    return review


@router.delete("/{review_id}", response_model=ReviewResponse)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    review = await review_service.delete_review(db, review_id, current_user.id, current_user.is_admin)
    logger.info(f"Отзыв удалён: id={review_id} by={current_user.username}")
    return review