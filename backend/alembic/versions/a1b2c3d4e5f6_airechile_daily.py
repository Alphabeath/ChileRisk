"""airechile_daily

Revision ID: a1b2c3d4e5f6
Revises: e9f1289a62db
Create Date: 2026-07-23 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "e9f1289a62db"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "airechile_daily",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("zone_slug", sa.String(length=64), nullable=False),
        sa.Column("condition_date", sa.Date(), nullable=False),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column("forecast_date", sa.Date(), nullable=True),
        sa.Column("forecast_level", sa.String(length=32), nullable=True),
        sa.Column("pm25_range_label", sa.String(length=128), nullable=True),
        sa.Column("zone_name", sa.String(length=160), nullable=False),
        sa.Column("region_code", sa.Integer(), nullable=True),
        sa.Column("comuna_codes", sa.JSON(), nullable=False),
        sa.Column("measures_current", sa.JSON(), nullable=False),
        sa.Column("restrictions_permanent", sa.JSON(), nullable=False),
        sa.Column("external_url", sa.String(length=512), nullable=False),
        sa.Column("raw", sa.JSON(), nullable=True),
        sa.Column(
            "synced_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("zone_slug", "condition_date", name="uq_airechile_zone_date"),
    )
    op.create_index(
        op.f("ix_airechile_daily_zone_slug"), "airechile_daily", ["zone_slug"], unique=False
    )
    op.create_index(
        op.f("ix_airechile_daily_condition_date"),
        "airechile_daily",
        ["condition_date"],
        unique=False,
    )
    op.create_index(
        op.f("ix_airechile_daily_region_code"),
        "airechile_daily",
        ["region_code"],
        unique=False,
    )
    op.create_index(
        "ix_airechile_daily_date_level",
        "airechile_daily",
        ["condition_date", "level"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_airechile_daily_date_level", table_name="airechile_daily")
    op.drop_index(op.f("ix_airechile_daily_region_code"), table_name="airechile_daily")
    op.drop_index(op.f("ix_airechile_daily_condition_date"), table_name="airechile_daily")
    op.drop_index(op.f("ix_airechile_daily_zone_slug"), table_name="airechile_daily")
    op.drop_table("airechile_daily")
