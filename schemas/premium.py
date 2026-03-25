from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


PREMIUM_THEMES = {"indigo", "sky", "emerald", "rose"}


class PremiumBuyRequest(BaseModel):
    # Для MVP покупка всегда “успешна” и выдаёт премиум навсегда.
    # Позже сюда можно будет добавить id/price/провайдера платежа.
    pass


class PremiumProfileUpdate(BaseModel):
    premium_theme: Optional[str] = None
    banner_url: Optional[str] = None

    @field_validator("premium_theme")
    @classmethod
    def validate_premium_theme(cls, v):
        if v is None:
            return v
        v = v.strip().lower()
        if v not in PREMIUM_THEMES:
            raise ValueError(f"Недопустимая тема премиума: {v}")
        return v


class PremiumStatusResponse(BaseModel):
    is_premium: bool = False
    premium_until: datetime | None = None
    premium_theme: str = "indigo"
    banner_url: Optional[str] = None

    @field_validator("is_premium", mode="before")
    @classmethod
    def default_is_premium(cls, v):
        return False if v is None else v

    @field_validator("premium_theme", mode="before")
    @classmethod
    def default_premium_theme(cls, v):
        return "indigo" if v is None else v

    model_config = {"from_attributes": True}

