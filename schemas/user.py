from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


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

class UserUpdate(BaseModel):
    username: str | None = None
    avatar_url: str | None = None