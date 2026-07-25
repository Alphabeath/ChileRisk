"""sernageomin_volcanic_alerts

Revision ID: d4e5f6a7b8c9
Revises: b7c8d9e0f1a2
Create Date: 2026-07-24 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sernageomin_volcanic_alerts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("volcano_key", sa.String(length=96), nullable=False),
        sa.Column("volcano_name", sa.String(length=200), nullable=False),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=400), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("region_code", sa.Integer(), nullable=True),
        sa.Column("region_name", sa.String(length=120), nullable=True),
        sa.Column("affected_scope", sa.String(length=16), nullable=False),
        sa.Column("comuna_codes", sa.JSON(), nullable=False),
        sa.Column("external_url", sa.String(length=512), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("page_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw", sa.JSON(), nullable=True),
        sa.Column(
            "synced_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("volcano_key", name="uq_sernageomin_volcano_key"),
    )
    op.create_index(
        op.f("ix_sernageomin_volcanic_alerts_region_code"),
        "sernageomin_volcanic_alerts",
        ["region_code"],
        unique=False,
    )
    op.create_index(
        op.f("ix_sernageomin_volcanic_alerts_is_active"),
        "sernageomin_volcanic_alerts",
        ["is_active"],
        unique=False,
    )
    op.create_index(
        "ix_sernageomin_active_level",
        "sernageomin_volcanic_alerts",
        ["is_active", "level"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_sernageomin_active_level", table_name="sernageomin_volcanic_alerts")
    op.drop_index(
        op.f("ix_sernageomin_volcanic_alerts_is_active"),
        table_name="sernageomin_volcanic_alerts",
    )
    op.drop_index(
        op.f("ix_sernageomin_volcanic_alerts_region_code"),
        table_name="sernageomin_volcanic_alerts",
    )
    op.drop_table("sernageomin_volcanic_alerts")
