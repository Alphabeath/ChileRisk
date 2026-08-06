"""remove demo account and derived synthetic risk caches

Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2026-07-31 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_DEMO_USER = "demo@chilerisk.cl"


def upgrade() -> None:
    demo_user_ids = "SELECT id FROM users WHERE lower(email) = lower(:email)"

    # Remove only the reserved hackathon account and its user-owned records.
    op.execute(
        sa.text(
            "DELETE FROM chat_messages "
            "WHERE thread_id IN ("
            "SELECT id FROM chat_threads WHERE user_id IN (" + demo_user_ids + ")"
            ")"
        ).bindparams(email=_DEMO_USER)
    )
    for table in ("chat_threads", "family_plans", "oauth_accounts", "password_reset_tokens"):
        op.execute(
            sa.text(
                f"DELETE FROM {table} WHERE user_id IN ({demo_user_ids})"
            ).bindparams(email=_DEMO_USER)
        )
    op.execute(
        sa.text("DELETE FROM users WHERE lower(email) = lower(:email)").bindparams(
            email=_DEMO_USER
        )
    )

    # These are derived caches and can be rebuilt from persisted real inputs.
    op.execute(sa.text("DELETE FROM daily_risk_scores"))
    op.execute(sa.text("DELETE FROM risk_scores"))

    # Remove legacy synthetic earthquakes without touching CSN events.
    op.execute(
        sa.text(
            "DELETE FROM seismic_impacts WHERE event_id IN ("
            "SELECT id FROM seismic_events WHERE lower(source) = 'mock'"
            ")"
        )
    )
    op.execute(sa.text("DELETE FROM seismic_events WHERE lower(source) = 'mock'"))


def downgrade() -> None:
    # This migration removes development data and derived caches irreversibly.
    pass
