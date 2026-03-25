from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from core.exceptions import ReviewNotFound
from core.limiter import limiter
from core.logging_config import get_logger
from schemas.review import ReviewCreate, ReviewResponse
from services import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])
logger = get_logger(__name__)

@router.get("/game/{game_id}")
async def get_reviews_by_game(game_id: int, db: AsyncSession = Depends(get_db)):
    return await review_service.get_reviews_by_game(db, game_id)

@router.get("/my")
async def get_my_reviews(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await review_service.get_reviews_by_user(db, current_user.id)

@router.get("/user/{user_id}")
async def get_reviews_by_user(user_id: int, db: AsyncSession = Depends(get_db)):
    # Исторический эндпоинт, который использует фронтенд для страницы профиля.
    return await review_service.get_reviews_by_user(db, user_id)

@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    review = await review_service.get_review(db, review_id)
    if not review:
        raise ReviewNotFound()
    return review

@router.post("/", response_model=ReviewResponse)
@limiter.limit("10/hour")
async def create_review(
    request: Request,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    review = await review_service.create_review(db, data, current_user.id)
    logger.info(f"Новый отзыв: user={current_user.username} game_id={data.game_id}")
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