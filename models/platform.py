from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
from .game_platforms import game_platforms

class Platform(Base):
    __tablename__ = "platforms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    games = relationship(
        "Game",
        secondary=game_platforms,
        back_populates="platforms",
        lazy="selectin"
    )