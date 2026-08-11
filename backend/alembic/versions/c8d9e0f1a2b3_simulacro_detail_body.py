"""simulacro detail body fields

Revision ID: c8d9e0f1a2b3
Revises: a7b8c9d0e1f2
Create Date: 2026-08-10 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("simulacros", sa.Column("headline", sa.String(length=512), nullable=True))
    op.add_column(
        "simulacros", sa.Column("schedule_note", sa.String(length=256), nullable=True)
    )
    op.add_column(
        "simulacros", sa.Column("hero_image_url", sa.String(length=768), nullable=True)
    )
    op.add_column(
        "simulacros",
        sa.Column(
            "detail_body",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    op.alter_column("simulacros", "detail_body", server_default=None)


def downgrade() -> None:
    op.drop_column("simulacros", "detail_body")
    op.drop_column("simulacros", "hero_image_url")
    op.drop_column("simulacros", "schedule_note")
    op.drop_column("simulacros", "headline")
