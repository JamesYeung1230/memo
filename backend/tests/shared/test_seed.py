import pytest

from shared.seed import DEFAULT_CONFIGS, init_default_configs


class TestDefaultConfigs:
    def test_contains_all_expected_keys(self):
        expected_keys = {
            "points_rules",
            "checkin_milestones",
            "default_review_config",
            "theme_config",
            "unlock_config",
            "ad_config",
            "homepage_module_order",
        }
        assert set(DEFAULT_CONFIGS.keys()) == expected_keys

    def test_points_rules_structure(self):
        rules = DEFAULT_CONFIGS["points_rules"]
        assert rules["learn_card"] == 1
        assert rules["daily_learn_card_limit"] == 10
        assert rules["ad_watch"] == 10
        assert rules["daily_ad_watch_limit"] == 100

    def test_checkin_milestones(self):
        assert DEFAULT_CONFIGS["checkin_milestones"]["7"] == 30
        assert DEFAULT_CONFIGS["checkin_milestones"]["14"] == 60

    def test_default_review_config(self):
        cfg = DEFAULT_CONFIGS["default_review_config"]
        assert cfg["review_nodes"] == [1, 2, 4, 7, 15]
        assert cfg["daily_limit"] == 20

    def test_theme_config(self):
        cfg = DEFAULT_CONFIGS["theme_config"]
        assert cfg["primary_color"] == "#4A90D9"
        assert cfg["primary_light"] == "#7AB8F5"

    def test_unlock_config(self):
        cfg = DEFAULT_CONFIGS["unlock_config"]
        assert cfg["domain_unlock_ranges"]["K04"] == 40
        assert cfg["premium_card_unlock"] == 20

    def test_homepage_module_order(self):
        modules = DEFAULT_CONFIGS["homepage_module_order"]["modules"]
        keys = [m["key"] for m in modules]
        assert "learning_progress" in keys
        assert len(modules) == 6


@pytest.mark.asyncio
class TestInitDefaultConfigs:
    async def test_inserts_all_new_configs(self, mocker):
        mock_session = mocker.AsyncMock()
        mock_session.__aenter__.return_value = mock_session

        scalar_mock = mocker.MagicMock()
        scalar_mock.scalar.return_value = None
        mock_session.execute.return_value = scalar_mock

        mock_factory = mocker.MagicMock()
        mock_factory.return_value.__aenter__.return_value = mock_session

        result = await init_default_configs(mock_factory)

        expected_keys = list(DEFAULT_CONFIGS.keys())
        assert sorted(result) == sorted(expected_keys)
        assert mock_session.execute.await_count == len(expected_keys) * 2
        mock_session.commit.assert_awaited_once()

    async def test_skips_existing_configs(self, mocker):
        mock_session = mocker.AsyncMock()
        mock_session.__aenter__.return_value = mock_session

        scalar_mock = mocker.MagicMock()
        scalar_mock.scalar.return_value = 1
        mock_session.execute.return_value = scalar_mock

        mock_factory = mocker.MagicMock()
        mock_factory.return_value.__aenter__.return_value = mock_session

        result = await init_default_configs(mock_factory)

        assert result == []
        mock_session.commit.assert_awaited_once()

    async def test_partial_insert(self, mocker):
        mock_session = mocker.AsyncMock()
        mock_session.__aenter__.return_value = mock_session

        existing_keys = {"points_rules", "theme_config"}

        async def execute_side_effect(*args, **kwargs):
            scalar_mock = mocker.MagicMock()
            params = args[1]
            key = params.get("key", "")
            scalar_mock.scalar.return_value = 1 if key in existing_keys else None
            return scalar_mock

        mock_session.execute.side_effect = execute_side_effect

        mock_factory = mocker.MagicMock()
        mock_factory.return_value.__aenter__.return_value = mock_session

        keys = list(DEFAULT_CONFIGS.keys())
        result = await init_default_configs(mock_factory)

        assert "points_rules" not in result
        assert "theme_config" not in result
        assert len(result) == len(keys) - 2
        mock_session.commit.assert_awaited_once()
