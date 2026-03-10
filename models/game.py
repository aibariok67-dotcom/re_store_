from sqlalchemy import String, Float, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
from .game_categories import game_categories
from .game_platforms import game_platforms
from datetime import date as date_type

class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    publisher: Mapped[str] = mapped_column(String, nullable=True)
    developer: Mapped[str] = mapped_column(String, nullable=True)
    series: Mapped[str] = mapped_column(String, nullable=True)
    release_date: Mapped[date_type] = mapped_column(Date, nullable=True)
    nominations: Mapped[str] = mapped_column(String, nullable=True)

    categories = relationship(
        "Category",
        secondary=game_categories,
        back_populates="games",
        lazy="selectin"
    )

    platforms = relationship(
        "Platform",
        secondary=game_platforms,
        back_populates="games",
        lazy="selectin"
    )