"""initial tables

Revision ID: 33937b3f5439
Revises: 
Create Date: 2026-03-12 19:58:19.691001
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '33937b3f5439'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(None, 'categories', ['name'])
    op.alter_column('games', 'description',
               existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('games', 'publisher',
               existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('games', 'developer',
               existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('games', 'series',
               existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('games', 'nominations',
               existing_type=sa.VARCHAR(), nullable=True)


def downgrade() -> None:
    op.alter_column('games', 'nominations',
               existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('games', 'series',
               existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('games', 'developer',
               existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('games', 'publisher',
               existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('games', 'description',
               existing_type=sa.VARCHAR(), nullable=False)
    op.drop_constraint(None, 'categories', type_='unique')