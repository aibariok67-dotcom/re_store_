from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from core.database import get_db
from core.datetime_utils import ensure_utc, utc_now
from core.dependencies import get_current_admin
from core.exceptions import UserNotFound, BadRequest, PermissionDenied
from core.logging_config import get_logger
from models.user import User
from schemas.user import UserResponse
from services.user_service import delete_user

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = get_logger(__name__)


@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise UserNotFound()
    if user.is_admin:
        raise PermissionDenied("Нельзя забанить админа")

    user.is_banned = True
    user.banned_until = None
    await db.commit()

    logger.warning(f"Бан (навсегда): {user.username} (ID={user_id}) — админ {current_user.username}")
    return {"detail": f"Пользователь {user.username} забанен навсегда"}


@router.post("/users/{user_id}/ban-temp")
async def ban_user_temp(
    user_id: int,
    banned_until: datetime,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise UserNotFound()
    if user.is_admin:
        raise PermissionDenied("Нельзя забанить админа")
    banned_until_utc = ensure_utc(banned_until)
    if banned_until_utc <= utc_now():
        raise BadRequest("Дата бана должна быть в будущем")

    user.is_banned = False
    user.banned_until = banned_until_utc
    await db.commit()

    logger.warning(
        f"Бан (до {banned_until_utc}): {user.username} (ID={user_id}) — админ {current_user.username}"
    )
    return {"detail": f"Пользователь {user.username} забанен до {banned_until_utc}"}


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise UserNotFound()

    user.is_banned = False
    user.banned_until = None
    await db.commit()

    logger.info(f"Разбан: {user.username} (ID={user_id}) — админ {current_user.username}")
    return {"detail": f"Пользователь {user.username} разбанен"}


@router.delete("/users/{user_id}")
async def delete_user_admin(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    if user_id == current_user.id:
        raise PermissionDenied("Нельзя удалить свою учётную запись")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UserNotFound()
    if user.is_admin:
        raise PermissionDenied("Нельзя удалить администратора")

    username = user.username
    await delete_user(db, user)
    logger.warning(f"Удалён пользователь: {username} (ID={user_id}) — админ {current_user.username}")
    return {"detail": f"Пользователь {username} удалён вместе с отзывами и избранным"}