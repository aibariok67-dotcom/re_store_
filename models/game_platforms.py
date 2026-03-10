from sqlalchemy import Table, Column, ForeignKey
from core.database import Base

game_platforms = Table(
    "game_platforms",
    Base.metadata,
    Column("game_id", ForeignKey("games.id"), primary_key=True),
    Column("platform_id", ForeignKey("platforms.id"), primary_key=True),
)