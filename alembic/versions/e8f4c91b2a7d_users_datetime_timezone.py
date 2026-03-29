"""users: banned_until, premium_until, created_at -> timezone-aware

Revision ID: e8f4c91b2a7d
Revises: c4035d4a5cef
Create Date: 2026-03-29

Существующие значения TIMESTAMP WITHOUT TIME ZONE считаются записанными в UTC
(Python datetime.utcnow / аналог). Для PostgreSQL конвертация: AT TIME ZONE 'UTC'.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e8f4c91b2a7d"
down_revision: Union[str, Sequence[str], None] = "c4035d4a5cef"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _pg_alter_user_ts_to_tz(column: str) -> None:
    op.execute(
        sa.text(
            f"ALTER TABLE users ALTER COLUMN {column} TYPE TIMESTAMP WITH TIME ZONE "
            f"USING ({column} AT TIME ZONE 'UTC')"
        )
    )


def _pg_alter_user_ts_to_naive(column: str) -> None:
    op.execute(
        sa.text(
            f"ALTER TABLE users ALTER COLUMN {column} TYPE TIMESTAMP WITHOUT TIME ZONE "
            f"USING ({column} AT TIME ZONE 'UTC')"
        )
    )


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        for col in ("banned_until", "premium_until", "created_at"):
            _pg_alter_user_ts_to_tz(col)
    elif dialect == "sqlite":
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column(
                "banned_until",
                existing_type=sa.DateTime(),
                type_=sa.DateTime(timezone=True),
                existing_nullable=True,
            )
            batch_op.alter_column(
                "premium_until",
                existing_type=sa.DateTime(),
                type_=sa.DateTime(timezone=True),
                existing_nullable=True,
            )
            batch_op.alter_column(
                "created_at",
                existing_type=sa.DateTime(),
                type_=sa.DateTime(timezone=True),
                existing_nullable=True,
            )
    else:
        # MySQL и др.: схема не меняется; храните моменты времени в UTC на уровне приложения.
        pass


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        for col in ("banned_until", "premium_until", "created_at"):
            _pg_alter_user_ts_to_naive(col)
    elif dialect == "sqlite":
        with op.batch_alter_table("users") as batch_op:
            batch_op.alter_column(
                "banned_until",
                existing_type=sa.DateTime(timezone=True),
                type_=sa.DateTime(),
                existing_nullable=True,
            )
            batch_op.alter_column(
                "premium_until",
                existing_type=sa.DateTime(timezone=True),
                type_=sa.DateTime(),
                existing_nullable=True,
            )
            batch_op.alter_column(
                "created_at",
                existing_type=sa.DateTime(timezone=True),
                type_=sa.DateTime(),
                existing_nullable=True,
            )
    else:
        pass
