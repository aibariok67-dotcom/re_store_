from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from core.database import get_db
from core.dependencies import get_current_admin
from core.exceptions import UserNotFound, BadRequest, PermissionDenied
from core.logging_config import get_logger
from models.user import User
from schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = get_logger(__name__)


@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
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
    current_user=Depends(get_current_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise UserNotFound()
    if user.is_admin:
        raise PermissionDenied("Нельзя забанить админа")
    if banned_until <= datetime.now(timezone.utc):
        raise BadRequest("Дата бана должна быть в будущем")

    user.is_banned = False
    user.banned_until = banned_until
    await db.commit()

    logger.warning(f"Бан (до {banned_until}): {user.username} (ID={user_id}) — админ {current_user.username}")
    return {"detail": f"Пользователь {user.username} забанен до {banned_until}"}


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_admin)
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