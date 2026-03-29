"""FK ON DELETE CASCADE: reviews, favorites, game_categories.game_id, game_platforms.game_id

Revision ID: b7c2d8e4f1a0
Revises: e8f4c91b2a7d
Create Date: 2026-03-29

Каскад только для зависимостей от users и games (отзывы, избранное, строки M2M при удалении игры).
Связи category_id / platform_id в ассоциативных таблицах без CASCADE — удаление категории или платформы
по-прежнему блокируется при наличии связей.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7c2d8e4f1a0"
down_revision: Union[str, Sequence[str], None] = "e8f4c91b2a7d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _pg_alter_fk_ondelete_cascade(
    table: str,
    column: str,
    ref_table: str,
    ref_column: str = "id",
) -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    for fk in insp.get_foreign_keys(table):
        if fk["constrained_columns"] == [column] and fk["referred_table"] == ref_table:
            name = fk["name"]
            op.drop_constraint(name, table, type_="foreignkey")
            op.create_foreign_key(
                name,
                table,
                ref_table,
                [column],
                [ref_column],
                ondelete="CASCADE",
            )
            return
    raise RuntimeError(f"No matching FK on {table}.{column} -> {ref_table}.{ref_column}")


def _pg_alter_fk_plain(
    table: str,
    column: str,
    ref_table: str,
    ref_column: str = "id",
) -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    for fk in insp.get_foreign_keys(table):
        if fk["constrained_columns"] == [column] and fk["referred_table"] == ref_table:
            name = fk["name"]
            op.drop_constraint(name, table, type_="foreignkey")
            op.create_foreign_key(
                name,
                table,
                ref_table,
                [column],
                [ref_column],
            )
            return
    raise RuntimeError(f"No matching FK on {table}.{column} -> {ref_table}.{ref_column}")


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    _pg_alter_fk_ondelete_cascade("reviews", "user_id", "users")
    _pg_alter_fk_ondelete_cascade("reviews", "game_id", "games")
    _pg_alter_fk_ondelete_cascade("favorites", "user_id", "users")
    _pg_alter_fk_ondelete_cascade("favorites", "game_id", "games")
    _pg_alter_fk_ondelete_cascade("game_categories", "game_id", "games")
    _pg_alter_fk_ondelete_cascade("game_platforms", "game_id", "games")


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    _pg_alter_fk_plain("game_platforms", "game_id", "games")
    _pg_alter_fk_plain("game_categories", "game_id", "games")
    _pg_alter_fk_plain("favorites", "game_id", "games")
    _pg_alter_fk_plain("favorites", "user_id", "users")
    _pg_alter_fk_plain("reviews", "game_id", "games")
    _pg_alter_fk_plain("reviews", "user_id", "users")
