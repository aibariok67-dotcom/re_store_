from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from schemas.user import UserCreate, UserResponse, UserLogin, Token
from services.user_service import register_user, login_user
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])



@router.post("/register", response_model=UserResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = await register_user(db, data)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    try:
        token = await login_user(db, data.email, data.password)
        return {"access_token": token, "token_type": "bearer"}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return current_user

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    """Публичный профиль юзера"""
    from services.user_service import get_user_by_id
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


class UpdateMeRequest(BaseModel):
    username: str | None = None
    password: str | None = None
    avatar_url: str | None = None

@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UpdateMeRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Обновить свой профиль"""
    from services.user_service import update_user
    return await update_user(db, current_user.id, data.model_dump(exclude_none=True))