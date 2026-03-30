from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)

    is_admin = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    banned_until = Column(DateTime(timezone=True), nullable=True)

    is_premium = Column(Boolean, default=False)
    premium_until = Column(DateTime(timezone=True), nullable=True)
    premium_theme = Column(String, default="indigo")
    banner_url = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=True,
        default=lambda: datetime.now(timezone.utc),
    )
