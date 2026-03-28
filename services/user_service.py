from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user import User
from schemas.user import UserCreate
from core.security import hash_password, verify_password, create_access_token

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
    await db.commit()
    await db.refresh(user)
    return user

async def login_user(db: AsyncSession, email: str, password: str) -> str:
    from datetime import datetime, timezone

    # Пробуем найти по email, если не нашли — ищем по username
    user = await get_user_by_email(db, email)
    if not user:
        user = await get_user_by_username(db, email)  # email-поле используем как логин
    if not user:
        raise ValueError("Неверный email или пароль")

    if not verify_password(password, user.hashed_password):
        raise ValueError("Неверный email или пароль")

    if user.is_banned:
        raise ValueError("Ваш аккаунт заблокирован навсегда")

    if user.banned_until and user.banned_until > datetime.now(timezone.utc):
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

    await db.commit()
    await db.refresh(user)
    return user