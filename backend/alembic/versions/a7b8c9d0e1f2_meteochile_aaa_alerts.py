"""Alembic: meteochile_aaa_alerts

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-08-02 20:15:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meteochile_aaa_alerts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("row_key", sa.String(length=64), nullable=False),
        sa.Column("aaa_id", sa.String(length=32), nullable=False),
        sa.Column("codigo_meteo", sa.String(length=64), nullable=False),
        sa.Column("tipo", sa.String(length=16), nullable=False),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column("fenomeno", sa.String(length=120), nullable=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("region_code", sa.Integer(), nullable=True),
        sa.Column("region_name", sa.String(length=120), nullable=True),
        sa.Column("affected_scope", sa.String(length=16), nullable=False),
        sa.Column("comuna_codes", sa.JSON(), nullable=False),
        sa.Column("zone_ids", sa.JSON(), nullable=False),
        sa.Column("external_url", sa.String(length=512), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_from", sa.String(length=200), nullable=True),
        sa.Column("valid_until", sa.String(length=200), nullable=True),
        sa.Column("raw", sa.JSON(), nullable=True),
        sa.Column(
            "synced_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("row_key", name="uq_meteochile_aaa_row_key"),
    )
    op.create_index(
        op.f("ix_meteochile_aaa_alerts_aaa_id"),
        "meteochile_aaa_alerts",
        ["aaa_id"],
    )
    op.create_index(
        op.f("ix_meteochile_aaa_alerts_region_code"),
        "meteochile_aaa_alerts",
        ["region_code"],
    )
    op.create_index(
        op.f("ix_meteochile_aaa_alerts_is_active"),
        "meteochile_aaa_alerts",
        ["is_active"],
    )
    op.create_index(
        "ix_meteochile_aaa_active_level",
        "meteochile_aaa_alerts",
        ["is_active", "level"],
    )


def downgrade() -> None:
    op.drop_index("ix_meteochile_aaa_active_level", table_name="meteochile_aaa_alerts")
    op.drop_index(
        op.f("ix_meteochile_aaa_alerts_is_active"), table_name="meteochile_aaa_alerts"
    )
    op.drop_index(
        op.f("ix_meteochile_aaa_alerts_region_code"),
        table_name="meteochile_aaa_alerts",
    )
    op.drop_index(
        op.f("ix_meteochile_aaa_alerts_aaa_id"), table_name="meteochile_aaa_alerts"
    )
    op.drop_table("meteochile_aaa_alerts")
