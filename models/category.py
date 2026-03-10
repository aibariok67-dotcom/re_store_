from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
from .game_categories import game_categories

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    games = relationship(
        "Game",
        secondary=game_categories,
        back_populates="categories",
        lazy="selectin"
    )