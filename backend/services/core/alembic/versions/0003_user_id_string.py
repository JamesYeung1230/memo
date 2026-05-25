"""change user_id from UUID to VARCHAR(100) for WeChat OpenID compatibility

Revision ID: 0003_user_id_string
Revises: 0002_seed_config
Create Date: 2026-05-22 07:00:00.000000
"""
from alembic import op


revision = "0003_user_id_string"
down_revision = "0002_seed_config"
branch_labels = None
depends_on = None

TABLES = [
    "core.learning_record",
    "core.favorite_card",
    "core.daily_challenge_record",
    "core.points_record",
    "core.answer_record",
    "core.review_config",
    "core.note",
    "core.user_achievement",
]

# Columns that are DATE in DB but VARCHAR in models
DATE_TO_VARCHAR = [
    ("core.daily_challenge_record", "challenge_date"),
    ("core.answer_record", "challenge_date"),
]


def upgrade():
    for table in TABLES:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN user_id TYPE VARCHAR(100)")
    for table, col in DATE_TO_VARCHAR:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE VARCHAR(20)")


def downgrade():
    for table in TABLES:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN user_id TYPE UUID USING user_id::uuid")
    for table, col in DATE_TO_VARCHAR:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE DATE USING {col}::date")
