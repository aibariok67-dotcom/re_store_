from pydantic import BaseModel, Field, field_validator
from datetime import date
from typing import List, Optional
from .category import CategoryResponse
from .platform import PlatformResponse


class GameBase(BaseModel):
    title: str
    price: float = Field(gt=0, description="Цена должна быть больше 0")
    description: Optional[str] = None
    publisher: Optional[str] = None
    developer: Optional[str] = None
    series: Optional[str] = None
    release_date: Optional[date] = None
    nominations: Optional[str] = None
    rating: Optional[float] = Field(default=None, ge=0, le=10, description="Рейтинг от 0 до 10")

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название не может быть пустым")
        return v.strip()


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