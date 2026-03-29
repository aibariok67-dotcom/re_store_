from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.premium import PremiumProfileUpdate, PremiumStatusResponse
from schemas.user import UserResponse
from services.premium_service import buy_premium, update_premium_profile, disable_premium

router = APIRouter(prefix="/premium", tags=["Premium"])


@router.post("/buy", response_model=UserResponse)
async def buy(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # MVP: выдаём премиум сразу.
    return await buy_premium(db, current_user.id)


@router.get("/status", response_model=PremiumStatusResponse)
async def status(current_user: User = Depends(get_current_user)):
    # Текущий статус можно считать прямо из user.
    return current_user


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    data: PremiumProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_premium_profile(db, current_user.id, data)


@router.post("/disable", response_model=UserResponse)
async def disable(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await disable_premium(db, current_user.id)

