from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from services import category_service
from schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=list[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    return await category_service.get_categories(db)

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    return await category_service.get_category(db, category_id)

@router.post("/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, db: AsyncSession = Depends(get_db)):
    return await category_service.create_category(db, category)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: int, category: CategoryUpdate, db: AsyncSession = Depends(get_db)):
    return await category_service.update_category(db, category_id, category)

@router.delete("/{category_id}", response_model=CategoryResponse)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    return await category_service.delete_category(db, category_id)