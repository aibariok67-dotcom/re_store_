from typing import NoReturn

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.datetime_utils import utc_now
from core.db_integrity import is_unique_violation
from core.exceptions import AlreadyExists, EmailTaken, UsernameTaken
from core.security import hash_password, verify_password, create_access_token
from models.user import User
from schemas.user import UserCreate


def _raise_register_integrity_error(exc: IntegrityError) -> NoReturn:
    msg = str(getattr(exc, "orig", None) or exc).lower()
    if "email" in msg or "users_email" in msg:
        raise EmailTaken() from exc
    if "username" in msg or "users_username" in msg:
        raise UsernameTaken() from exc
    raise AlreadyExists("Пользователь") from exc

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()

async def register_user(db: AsyncSession, data: UserCreate) -> User:
    existing_user = await get_user_by_email(db, data.email)
    if existing_user:
        raise ValueError("Пользователь с таким email уже существует")

    existing_username = await get_user_by_username(db, data.username)
    if existing_username:
        raise ValueError("Пользователь с таким никнеймом уже существует")

    hashed = hash_password(data.password)

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hashed,
    )

    db.add(user)
    try:
        await db.commit()
        await db.refresh(user)
    except IntegrityError as e:
        await db.rollback()
        if not is_unique_violation(e):
            raise
        _raise_register_integrity_error(e)
    return user

async def login_user(db: AsyncSession, email: str, password: str) -> str:
    user = await get_user_by_email(db, email)
    if not user:
        user = await get_user_by_username(db, email)
    if not user:
        raise ValueError("Неверный email или пароль")

    if not verify_password(password, user.hashed_password):
        raise ValueError("Неверный email или пароль")

    if user.is_banned:
        raise ValueError("Ваш аккаунт заблокирован навсегда")

    if user.banned_until and user.banned_until > utc_now():
        raise ValueError(f"Ваш аккаунт заблокирован до {user.banned_until.strftime('%d.%m.%Y %H:%M')}")

    token = create_access_token({"sub": str(user.id)})
    return token

async def update_user(db: AsyncSession, user_id: int, data: dict) -> User:
    """Обновить профиль юзера"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("Пользователь не найден")

    if "username" in data and data["username"]:
        user.username = data["username"]
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"]
    if "password" in data and data["password"]:
        user.hashed_password = hash_password(data["password"])

    try:
        await db.commit()
        await db.refresh(user)
    except IntegrityError as e:
        await db.rollback()
        if not is_unique_violation(e):
            raise
        msg = str(getattr(e, "orig", None) or e).lower()
        if "username" in msg or "users_username" in msg:
            raise UsernameTaken() from e
        raise AlreadyExists("Пользователь") from e
    return user


async def delete_user(db: AsyncSession, user: User) -> None:
    """Удалить пользователя; отзывы и избранное удаляются каскадом в БД."""
    await db.delete(user)
    await db.commit()