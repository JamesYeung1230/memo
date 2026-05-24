"""init auth schema: admin + user tables

Revision ID: 0001_init_auth
Revises: None
Create Date: 2026-05-09 10:00:00.000000
"""
from alembic import op


revision = "0001_init_auth"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE SCHEMA IF NOT EXISTS auth")

    op.execute("""
        CREATE TABLE auth.admin (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE UNIQUE INDEX idx_admin_username ON auth.admin (username)
    """)

    op.execute("""
        CREATE TABLE auth.user (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            openid VARCHAR(64) NOT NULL UNIQUE,
            nickname VARCHAR(100) DEFAULT NULL,
            avatar_url VARCHAR(500) DEFAULT NULL,
            violation_count INTEGER NOT NULL DEFAULT 0,
            review_ban_until TIMESTAMPTZ DEFAULT NULL,
            share_ban_until TIMESTAMPTZ DEFAULT NULL,
            last_login_at TIMESTAMPTZ DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE UNIQUE INDEX idx_user_openid ON auth.user (openid)
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS auth.user CASCADE")
    op.execute("DROP TABLE IF EXISTS auth.admin CASCADE")
    op.execute("DROP SCHEMA IF EXISTS auth CASCADE")
