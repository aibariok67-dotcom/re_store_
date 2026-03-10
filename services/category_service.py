from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate

async def get_categories(db: AsyncSession):
    result = await db.execute(select(Category))
    return result.unique().scalars().all()

async def get_category(db: AsyncSession, category_id: int):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.unique().scalars().one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail=f"Category {category_id} not found")
    return category

async def create_category(db: AsyncSession, category: CategoryCreate):
    new_category = Category(**category.model_dump())
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    return new_category

async def update_category(db: AsyncSession, category_id: int, category_data: CategoryUpdate):
    category = await get_category(db, category_id)
    for field, value in category_data.model_dump().items():
        setattr(category, field, value)
    await db.commit()
    await db.refresh(category)
    return category

async def delete_category(db: AsyncSession, category_id: int):
    category = await get_category(db, category_id)
    await db.delete(category)
    await db.commit()
    return category