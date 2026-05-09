from typing import Any

DEFAULT_CONFIGS: dict[str, dict[str, Any]] = {
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
    "checkin_milestones": {
        "3": 15,
        "7": 30,
        "14": 60,
    },
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
        "domain_unlock_ranges": {
            "K04": 40,
            "K05": 40,
            "K06": 50,
            "K07": 60,
        },
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


async def init_default_configs(db_session_factory) -> list[str]:
    inserted: list[str] = []
    async with db_session_factory() as session:
        from sqlalchemy import text

        for config_key, config_value in DEFAULT_CONFIGS.items():
            result = await session.execute(
                text("SELECT 1 FROM core.config WHERE config_key = :key"),
                {"key": config_key},
            )
            if result.scalar() is None:
                await session.execute(
                    text(
                        "INSERT INTO core.config (config_key, config_value, description, updated_by) "
                        "VALUES (:key, :value, :desc, :by)"
                    ),
                    {
                        "key": config_key,
                        "value": config_value,
                        "desc": f"Default config for {config_key}",
                        "by": "system",
                    },
                )
                inserted.append(config_key)
        await session.commit()
    return inserted
