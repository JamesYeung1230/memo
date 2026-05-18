"""seed admin account

Revision ID: 0002_seed_admin
Revises: 0001_init_auth
Create Date: 2026-05-09 10:00:00.000000
"""
import os
from alembic import op
from sqlalchemy import text


revision = "0002_seed_admin"
down_revision = "0001_init_auth"
branch_labels = None
depends_on = None


def upgrade():
    username = os.environ.get("ADMIN_USERNAME", "admin")
    password_hash = os.environ.get("ADMIN_PASSWORD_HASH", "")
    if not password_hash:
        raise RuntimeError(
            "ADMIN_PASSWORD_HASH environment variable is required "
            "for seeding admin account"
        )
    op.get_bind().execute(
        text(
            "INSERT INTO auth.admin (username, password_hash) "
            "VALUES (:username, :password_hash)"
        ),
        {"username": username, "password_hash": password_hash},
    )


def downgrade():
    username = os.environ.get("ADMIN_USERNAME", "admin")
    op.get_bind().execute(
        text("DELETE FROM auth.admin WHERE username = :username"),
        {"username": username},
    )
