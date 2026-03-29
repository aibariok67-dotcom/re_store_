from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from core.db_integrity import is_unique_violation
from core.exceptions import PlatformNameTaken
from models.platform import Platform
from schemas.platform import PlatformCreate, PlatformUpdate

async def get_platforms(db: AsyncSession):
    result = await db.execute(select(Platform))
    return result.unique().scalars().all()

async def get_platform(db: AsyncSession, platform_id: int):
    result = await db.execute(select(Platform).where(Platform.id == platform_id))
    platform = result.unique().scalars().one_or_none()
    if not platform:
        raise HTTPException(status_code=404, detail=f"Platform {platform_id} not found")
    return platform

async def create_platform(db: AsyncSession, platform: PlatformCreate):
    new_platform = Platform(**platform.model_dump())
    db.add(new_platform)
    try:
        await db.commit()
        await db.refresh(new_platform)
    except IntegrityError as e:
        await db.rollback()
        if not is_unique_violation(e):
            raise
        raise PlatformNameTaken() from e
    return new_platform

async def update_platform(db: AsyncSession, platform_id: int, platform_data: PlatformUpdate):
    platform = await get_platform(db, platform_id)
    for field, value in platform_data.model_dump().items():
        setattr(platform, field, value)
    try:
        await db.commit()
        await db.refresh(platform)
    except IntegrityError as e:
        await db.rollback()
        if not is_unique_violation(e):
            raise
        raise PlatformNameTaken() from e
    return platform

async def delete_platform(db: AsyncSession, platform_id: int):
    platform = await get_platform(db, platform_id)
    await db.delete(platform)
    await db.commit()
    return platform