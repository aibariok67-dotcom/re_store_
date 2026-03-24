from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Никнейм минимум 3 символа")
        if len(v) > 30:
            raise ValueError("Никнейм максимум 30 символов")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Никнейм может содержать только буквы, цифры, _ и -")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Пароль минимум 6 символов")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_verified: bool
    is_admin: bool
    is_banned: bool = False  
    banned_until: datetime | None
    created_at: datetime
    avatar_url: str | None

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

class UpdateMeRequest(BaseModel):
    username: str | None = None
    password: str | None = None
    avatar_url: str | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if v is None:
            return v
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Никнейм минимум 3 символа")
        if len(v) > 30:
            raise ValueError("Никнейм максимум 30 символов")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Никнейм может содержать только буквы, цифры, _ и -")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if v is None:
            return v
        if len(v) < 6:
            raise ValueError("Пароль минимум 6 символов")
        return v
