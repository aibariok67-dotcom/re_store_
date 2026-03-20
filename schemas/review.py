from pydantic import BaseModel, field_validator
from datetime import datetime


class ReviewCreate(BaseModel):
    game_id: int
    rating: float
    text: str
    image_url: str | None = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v < 1 or v > 10:
            raise ValueError("Рейтинг должен быть от 1 до 10")
        return v


class ReviewCreateAdmin(ReviewCreate):
    is_paid: bool = False
    price: float | None = None

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Цена должна быть больше 0")
        return v


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    game_id: int
    rating: float
    text: str
    is_paid: bool
    price: float | None
    image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}