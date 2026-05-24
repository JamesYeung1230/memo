"""seed knowledge domains K01~K07

Revision ID: 0002_seed_domains
Revises: 0001_init_knowledge
Create Date: 2026-05-09 10:00:00.000000
"""
from alembic import op


revision = "0002_seed_domains"
down_revision = "0001_init_knowledge"
branch_labels = None
depends_on = None


DOMAINS = [
    {"name": "编程基础概念", "icon": "code", "sort_order": 1, "is_free": True, "unlock_points": None},
    {"name": "计算机网络基础", "icon": "network", "sort_order": 2, "is_free": True, "unlock_points": None},
    {"name": "软件工程流程", "icon": "process", "sort_order": 3, "is_free": True, "unlock_points": None},
    {"name": "数据库基础", "icon": "database", "sort_order": 4, "is_free": False, "unlock_points": 40},
    {"name": "操作系统基础", "icon": "os", "sort_order": 5, "is_free": False, "unlock_points": 40},
    {"name": "AI编程实践技巧", "icon": "ai", "sort_order": 6, "is_free": False, "unlock_points": 50},
    {"name": "AI编程与传统编程", "icon": "compare", "sort_order": 7, "is_free": False, "unlock_points": 60},
]


def upgrade():
    for d in DOMAINS:
        unlock = f"'{d['unlock_points']}'" if d['unlock_points'] is not None else "NULL"
        op.execute(
            f"INSERT INTO knowledge.domain "
            f"(name, icon, sort_order, is_free, unlock_points, status) "
            f"VALUES ('{d['name']}', '{d['icon']}', {d['sort_order']}, {str(d['is_free']).lower()}, {unlock}, 'published')"
        )


def downgrade():
    names = [d["name"] for d in DOMAINS]
    for name in names:
        op.execute(f"DELETE FROM knowledge.domain WHERE name = '{name}'")
