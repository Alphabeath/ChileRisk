"""add_inundacion_score

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-07-25 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "risk_scores",
        sa.Column("inundacion_score", sa.Float(), server_default="0.0", nullable=False),
    )
    op.add_column(
        "daily_risk_scores",
        sa.Column("inundacion_score", sa.Float(), server_default="0.0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("daily_risk_scores", "inundacion_score")
    op.drop_column("risk_scores", "inundacion_score")
