from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.datetime_utils import utc_now
from core.exceptions import PermissionDenied
from models.user import User

from schemas.premium import PremiumProfileUpdate


def _is_active_premium(user: User) -> bool:
    if not user.is_premium:
        return False
    if user.premium_until is None:
        return True
    return user.premium_until > utc_now()


async def buy_premium(db: AsyncSession, user_id: int) -> User:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one()

    user.is_premium = True
    user.premium_until = None
    if not user.premium_theme:
        user.premium_theme = "indigo"
    await db.commit()
    await db.refresh(user)
    return user


async def update_premium_profile(
    db: AsyncSession, user_id: int, data: PremiumProfileUpdate
) -> User:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one()

    if not _is_active_premium(user):
        raise PermissionDenied("Доступно только для премиум-аккаунтов")

    if data.premium_theme is not None:
        user.premium_theme = data.premium_theme
    if data.banner_url is not None:
        user.banner_url = data.banner_url

    await db.commit()
    await db.refresh(user)
    return user


async def disable_premium(db: AsyncSession, user_id: int) -> User:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one()

    user.is_premium = False
    user.premium_until = None

    user.premium_theme = "indigo"
    user.banner_url = None

    await db.commit()
    await db.refresh(user)
    return user

