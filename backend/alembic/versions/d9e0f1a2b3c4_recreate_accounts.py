"""recreate email/password accounts; drop oauth

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-08-12 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d9e0f1a2b3c4"
down_revision: Union[str, Sequence[str], None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(sa.text("DELETE FROM chat_messages"))
    op.execute(sa.text("DELETE FROM chat_threads"))
    op.execute(sa.text("DELETE FROM family_plans"))
    op.execute(sa.text("DELETE FROM password_reset_tokens"))
    op.execute(sa.text("DELETE FROM oauth_accounts"))
    op.execute(sa.text("DELETE FROM users"))

    op.drop_index(op.f("ix_oauth_accounts_user_id"), table_name="oauth_accounts")
    op.drop_table("oauth_accounts")

    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
    op.add_column(
        "users",
        sa.Column("notify_email_alerts", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "users",
        sa.Column(
            "notify_email_simulacros", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
    )
    op.alter_column("users", "notify_email_alerts", server_default=None)
    op.alter_column("users", "notify_email_simulacros", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "notify_email_simulacros")
    op.drop_column("users", "notify_email_alerts")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)
    op.create_table(
        "oauth_accounts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("provider_account_id", sa.String(length=255), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "provider_account_id"),
    )
    op.create_index(op.f("ix_oauth_accounts_user_id"), "oauth_accounts", ["user_id"], unique=False)
