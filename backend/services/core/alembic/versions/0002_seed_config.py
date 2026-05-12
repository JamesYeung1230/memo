"""seed default core configs (points_rules, theme, review config, etc.)

Revision ID: 0002_seed_config
Revises: 0001_init_core
Create Date: 2026-05-09 10:00:00.000000
"""
import json

from alembic import op
from sqlalchemy import text


revision = "0002_seed_config"
down_revision = "0001_init_core"
branch_labels = None
depends_on = None


DEFAULT_CONFIGS = {
    "points_rules": {
        "learn_card": 1,
        "daily_learn_card_limit": 10,
        "daily_challenge": 15,
        "daily_challenge_limit": 15,
        "create_note": 5,
        "daily_create_note_limit": 15,
        "ad_watch": 10,
        "daily_ad_watch_limit": 100,
    },
    "checkin_milestones": {"3": 15, "7": 30, "14": 60},
    "default_review_config": {
        "review_nodes": [1, 2, 4, 7, 15],
        "daily_limit": 20,
        "forgotten_alert_days": 7,
        "reminder_time": "20:00",
        "weekend_quiet": False,
    },
    "theme_config": {
        "primary_color": "#4A90D9",
        "primary_light": "#7AB8F5",
        "primary_dark": "#2D6EC9",
    },
    "unlock_config": {
        "domain_unlock_ranges": {"K04": 40, "K05": 40, "K06": 50, "K07": 60},
        "premium_card_unlock": 20,
    },
    "ad_config": {
        "splash_enabled": False,
        "splash_ad_unit_id": "",
        "reward_ad_unit_id": "",
        "splash_skip_seconds": 5,
    },
    "homepage_module_order": {
        "modules": [
            {"key": "learning_progress", "visible": True},
            {"key": "today_review", "visible": True},
            {"key": "recommended_cards", "visible": True},
            {"key": "daily_challenge", "visible": True},
            {"key": "quick_note", "visible": True},
            {"key": "points_balance", "visible": True},
        ],
    },
}

CONFIG_DESCRIPTIONS = {
    "points_rules": "积分规则（各行为积分数值和日上限）",
    "checkin_milestones": "连续打卡里程碑积分配置",
    "default_review_config": "默认复习计划配置",
    "theme_config": "主题色配置",
    "unlock_config": "知识领域和高级卡片解锁积分配置",
    "ad_config": "广告配置（开屏广告开关、广告位ID、跳过时长）",
    "homepage_module_order": "首页模块排序配置",
}


def upgrade():
    for config_key, config_value in DEFAULT_CONFIGS.items():
        value_json = json.dumps(config_value, ensure_ascii=False)
        description = CONFIG_DESCRIPTIONS.get(config_key, "")
        op.execute(
            text(
                "INSERT INTO core.config (config_key, config_value, description, updated_by) "
                "VALUES (:key, :value, :desc, 'system') "
                "ON CONFLICT (config_key) DO NOTHING"
            ),
            {"key": config_key, "value": value_json, "desc": description},
        )


def downgrade():
    keys = list(DEFAULT_CONFIGS.keys())
    for key in keys:
        op.execute(
            text("DELETE FROM core.config WHERE config_key = :key"),
            {"key": key},
        )
