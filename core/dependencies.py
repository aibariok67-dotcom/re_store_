from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import decode_access_token
from services.user_service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Невалидный токен")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Невалидный токен")

    user = await get_user_by_id(db, int(user_id))
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    return user


async def get_current_admin(current_user=Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Нет прав доступа")
    return current_user
