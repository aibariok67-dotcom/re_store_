from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user, get_current_admin
from schemas.review import ReviewCreate, ReviewCreateAdmin, ReviewResponse
from services import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/game/{game_id}")
async def get_reviews_by_game(game_id: int, db: AsyncSession = Depends(get_db)):
    """Все отзывы на игру — доступно всем"""
    return await review_service.get_reviews_by_game(db, game_id)


@router.get("/my")
async def get_my_reviews(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Мои отзывы"""
    return await review_service.get_my_reviews(db, current_user.id)


@router.get("/user/{user_id}")
async def get_reviews_by_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Все отзывы конкретного юзера"""
    return await review_service.get_reviews_by_user(db, user_id)


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    """Один отзыв — доступно всем"""
    review = await review_service.get_review(db, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    return review


@router.post("/", response_model=ReviewResponse)
async def create_user_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Создать бесплатный отзыв — любой авторизованный юзер"""
    try:
        return await review_service.create_user_review(db, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin", response_model=ReviewResponse)
async def create_admin_review(
    data: ReviewCreateAdmin,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    """Создать платный отзыв — только админ"""
    try:
        return await review_service.create_admin_review(db, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{review_id}", response_model=ReviewResponse)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Удалить отзыв — автор или админ"""
    try:
        return await review_service.delete_review(
            db, review_id, current_user.id, current_user.is_admin
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))