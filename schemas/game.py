from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date
from typing import List, Optional
from .category import CategoryResponse
from .platform import PlatformResponse


class GameBase(BaseModel):
    title: str
    description: Optional[str] = None
    publisher: Optional[str] = None
    developer: Optional[str] = None
    series: Optional[str] = None
    release_date: Optional[date] = None
    nominations: Optional[str] = None
    rating: Optional[float] = Field(default=None, ge=0, le=10, description="Рейтинг от 0 до 10")
    image_url: Optional[str] = None
    

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название не может быть пустым")
        return v.strip()


class GameCreate(GameBase):
    category_ids: Optional[List[int]] = Field(default_factory=list)
    platform_ids: Optional[List[int]] = Field(default_factory=list)
    aliases: str | None = None


class GameUpdate(GameBase):
    category_ids: Optional[List[int]] = Field(default_factory=list)
    platform_ids: Optional[List[int]] = Field(default_factory=list)
    aliases: str | None = None


class GamePatch(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    publisher: Optional[str] = None
    developer: Optional[str] = None
    series: Optional[str] = None
    release_date: Optional[date] = None
    nominations: Optional[str] = None
    rating: Optional[float] = Field(default=None, ge=0, le=10)
    image_url: Optional[str] = None
    category_ids: Optional[List[int]] = None
    platform_ids: Optional[List[int]] = None
    aliases: str | None = None


class GameResponse(GameBase):
    id: int
    categories: List[CategoryResponse] = []
    platforms: List[PlatformResponse] = []

    model_config = ConfigDict(from_attributes=True)