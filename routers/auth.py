from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from core.exceptions import BadRequest, UserNotFound, InvalidCredentials, UserBanned
from core.logging_config import get_logger
from core.limiter import limiter
from schemas.user import UserCreate, UserResponse, UserLogin, Token, UpdateMeRequest
from services.user_service import register_user, login_user, get_user_by_id, update_user

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger(__name__)


@router.post("/register", response_model=UserResponse)
@limiter.limit("3/hour")
async def register(request: Request, data: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = await register_user(db, data)
        logger.info(f"Новый пользователь: {user.username} ({user.email})")
        return user
    except ValueError as e:
        raise BadRequest(str(e))


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    try:
        token = await login_user(db, data.email, data.password)
        logger.info(f"Вход: {data.email}")
        return {"access_token": token, "token_type": "bearer"}
    except ValueError as e:
        msg = str(e)
        logger.warning(f"Неудачный вход: {data.email} ({msg})")

        if msg == "Неверный email или пароль":
            raise InvalidCredentials()
        if msg.startswith("Ваш аккаунт заблокирован"):
            raise UserBanned()

        raise BadRequest(msg)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UpdateMeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = await update_user(db, current_user.id, data.model_dump(exclude_none=True))
    logger.info(f"Профиль обновлён: {current_user.username}")
    return updated


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise UserNotFound()
    return user

