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

    @field_validator("text")
    @classmethod
    def validate_text(cls, v):
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Отзыв слишком короткий — минимум 10 символов")
        if len(v) > 2000:
            raise ValueError("Отзыв слишком длинный — максимум 2000 символов")
        return v

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    game_id: int
    game_title: str | None = None
    rating: float
    text: str
    image_url: str | None
    created_at: datetime
    username: str | None = None

    # Чтобы фронт мог показывать бейдж “Премиум” у автора.
    is_premium: bool = False
    @field_validator("is_premium", mode="before")
    @classmethod
    def default_is_premium(cls, v):
        return False if v is None else v

    premium_theme: str | None = None
    @field_validator("premium_theme", mode="before")
    @classmethod
    def default_premium_theme(cls, v):
        return None if v is None else v

    model_config = {"from_attributes": True}