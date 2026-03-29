from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_admin
from models.user import User
from services import platform_service
from schemas.platform import PlatformResponse, PlatformCreate, PlatformUpdate

router = APIRouter(prefix="/platforms", tags=["Platforms"])

@router.get("/", response_model=list[PlatformResponse])
async def get_platforms(db: AsyncSession = Depends(get_db)):
    return await platform_service.get_platforms(db)

@router.get("/{platform_id}", response_model=PlatformResponse)
async def get_platform(platform_id: int, db: AsyncSession = Depends(get_db)):
    return await platform_service.get_platform(db, platform_id)

@router.post("/", response_model=PlatformResponse)
async def create_platform(
    platform: PlatformCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return await platform_service.create_platform(db, platform)

@router.put("/{platform_id}", response_model=PlatformResponse)
async def update_platform(
    platform_id: int,
    platform: PlatformUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return await platform_service.update_platform(db, platform_id, platform)

@router.delete("/{platform_id}", response_model=PlatformResponse)
async def delete_platform(
    platform_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return await platform_service.delete_platform(db, platform_id)