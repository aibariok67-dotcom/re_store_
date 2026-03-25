from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    
    # Системные флаги
    is_admin = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    banned_until = Column(DateTime, nullable=True)

    # --- PREMIUM ФУНКЦИОНАЛ ---
    is_premium = Column(Boolean, default=False)
    premium_until = Column(DateTime, nullable=True)
    premium_theme = Column(String, default="indigo")  # Тема оформления
    banner_url = Column(String, nullable=True)        # Кастомная обложка профиля
    # --------------------------

    created_at = Column(DateTime, default=datetime.utcnow)

    # Если есть связи с другими моделями, они ниже
    # reviews = relationship("Review", back_populates="user")