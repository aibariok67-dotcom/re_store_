from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import decode_access_token
from core.exceptions import InvalidToken, UserNotFound, PermissionDenied, UserBanned
from services.user_service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    payload = decode_access_token(token)
    if payload is None:
        raise InvalidToken()

    user_id = payload.get("sub")
    if user_id is None:
        raise InvalidToken()

    user = await get_user_by_id(db, int(user_id))
    if user is None:
        raise UserNotFound()

    # Проверяем бан прямо здесь — забаненный не пройдёт ни один защищённый эндпоинт
    if user.is_banned:
        from datetime import datetime, timezone
        if user.banned_until is None or user.banned_until > datetime.now(timezone.utc):
            raise UserBanned()

    return user


async def get_current_admin(current_user=Depends(get_current_user)):
    if not current_user.is_admin:
        raise PermissionDenied()
    return current_user