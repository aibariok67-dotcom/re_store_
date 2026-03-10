from sqlalchemy import Table, Column, ForeignKey
from core.database import Base

game_categories = Table(
    "game_categories",
    Base.metadata,
    Column("game_id", ForeignKey("games.id"), primary_key=True),
    Column("category_id", ForeignKey("categories.id"), primary_key=True),
)