from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional
from .category import CategoryResponse
from .platform import PlatformResponse


class GameBase(BaseModel):
    title: str
    price: float
    description: Optional[str] = None
    publisher: Optional[str] = None
    developer: Optional[str] = None
    series: Optional[str] = None
    release_date: Optional[date] = None
    nominations: Optional[str] = None


class GameCreate(GameBase):
    category_ids: Optional[List[int]] = Field(default_factory=list)
    platform_ids: Optional[List[int]] = Field(default_factory=list)


class GameUpdate(GameBase):
    category_ids: Optional[List[int]] = Field(default_factory=list)
    platform_ids: Optional[List[int]] = Field(default_factory=list)


class GameResponse(GameBase):
    id: int
    categories: List[CategoryResponse] = []
    platforms: List[PlatformResponse] = []

    class Config:
        from_attributes = True