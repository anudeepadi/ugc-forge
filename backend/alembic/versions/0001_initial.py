"""initial

Revision ID: 0001
Revises:
Create Date: 2026-05-07 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("product_url", sa.String(2048), nullable=False, server_default=""),
        sa.Column("product_description", sa.Text(), nullable=False),
        sa.Column("niche", sa.String(100), nullable=False),
        sa.Column("target_audience", sa.Text(), nullable=False, server_default=""),
        sa.Column("claims_and_proof", sa.Text(), nullable=False, server_default=""),
        sa.Column("script_tone", sa.String(100), nullable=False, server_default="casual-founder"),
        sa.Column("voice_style", sa.String(100), nullable=False, server_default="warm-authentic"),
        sa.Column("status", sa.String(50), nullable=False, server_default="ready"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "scripts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("hook", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("cta", sa.Text(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("viral_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "renders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("script_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("avatar", sa.String(100), nullable=False, server_default="Avatar A"),
        sa.Column("voice", sa.String(100), nullable=False, server_default="Warm"),
        sa.Column("status", sa.String(50), nullable=False, server_default="queued"),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("video_url", sa.String(2048), nullable=True),
        sa.Column("video_url_portrait", sa.String(2048), nullable=True),
        sa.Column("video_url_square", sa.String(2048), nullable=True),
        sa.Column("video_url_landscape", sa.String(2048), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("error_message", sa.String(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["script_id"], ["scripts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("renders")
    op.drop_table("scripts")
    op.drop_table("campaigns")
