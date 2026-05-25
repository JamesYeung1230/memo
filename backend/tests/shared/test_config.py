import pytest

from shared.config import (
    get_database_url,
    get_env,
    get_redis_url,
    load_env,
)


class TestLoadEnv:
    def test_load_env_calls_load_dotenv_with_path(self, monkeypatch):
        called = []
        monkeypatch.setattr(
            "shared.config.load_dotenv",
            lambda f: called.append(f),
        )
        load_env(".env.test")
        assert called == [".env.test"]

    def test_load_env_default_path(self, monkeypatch):
        called = []
        monkeypatch.setattr(
            "shared.config.load_dotenv",
            lambda f: called.append(f),
        )
        load_env()
        assert called == [".env"]


class TestGetDatabaseUrl:
    def test_default_host_port_and_schema(self, monkeypatch):
        monkeypatch.setenv("DB_USER", "app_user")
        monkeypatch.setenv("DB_PASSWORD", "secret123")
        monkeypatch.setenv("DB_NAME", "memo_db")
        url = get_database_url()
        assert url.startswith("postgresql+asyncpg://")
        assert "app_user:secret123" in url
        assert "localhost:5432" in url
        assert "memo_db" in url

    def test_all_env_vars_set(self, monkeypatch):
        monkeypatch.setenv("DB_USER", "admin")
        monkeypatch.setenv("DB_PASSWORD", "pass")
        monkeypatch.setenv("DB_HOST", "db.example.com")
        monkeypatch.setenv("DB_PORT", "15432")
        monkeypatch.setenv("DB_NAME", "prod_db")
        url = get_database_url()
        assert "admin:pass" in url
        assert "db.example.com:15432" in url
        assert "prod_db" in url

    def test_special_chars_in_password(self, monkeypatch):
        monkeypatch.setenv("DB_USER", "user")
        monkeypatch.setenv("DB_PASSWORD", "p@ss:w rd+")
        monkeypatch.setenv("DB_NAME", "test_db")
        url = get_database_url()
        assert "user" in url
        assert "p%40ss" in url
        assert "%3A" in url or ":w" in url
        assert "rd%2B" in url or "rd+" in url

    def test_url_format_complete(self, monkeypatch):
        monkeypatch.setenv("DB_USER", "user")
        monkeypatch.setenv("DB_PASSWORD", "pass")
        monkeypatch.setenv("DB_NAME", "test_db")
        url = get_database_url()
        assert "user:pass" in url
        assert "localhost:5432" in url
        assert "test_db" in url

    def test_missing_user_raises_key_error(self, monkeypatch):
        monkeypatch.delenv("DB_USER", raising=False)
        monkeypatch.setenv("DB_PASSWORD", "pass")
        monkeypatch.setenv("DB_NAME", "test_db")
        with pytest.raises(KeyError):
            get_database_url()

    def test_missing_password_raises_key_error(self, monkeypatch):
        monkeypatch.setenv("DB_USER", "user")
        monkeypatch.delenv("DB_PASSWORD", raising=False)
        monkeypatch.setenv("DB_NAME", "test_db")
        with pytest.raises(KeyError):
            get_database_url()

    def test_missing_db_name_raises_key_error(self, monkeypatch):
        monkeypatch.setenv("DB_USER", "user")
        monkeypatch.setenv("DB_PASSWORD", "pass")
        monkeypatch.delenv("DB_NAME", raising=False)
        with pytest.raises(KeyError):
            get_database_url()


class TestGetRedisUrl:
    def test_default_values(self, monkeypatch):
        monkeypatch.delenv("REDIS_HOST", raising=False)
        monkeypatch.delenv("REDIS_PORT", raising=False)
        monkeypatch.delenv("REDIS_PASSWORD", raising=False)
        url = get_redis_url()
        assert url == "redis://localhost:6379"

    def test_with_password(self, monkeypatch):
        monkeypatch.setenv("REDIS_HOST", "redis.example.com")
        monkeypatch.setenv("REDIS_PORT", "6380")
        monkeypatch.setenv("REDIS_PASSWORD", "secret123")
        url = get_redis_url()
        assert url == "redis://:secret123@redis.example.com:6380"

    def test_without_password(self, monkeypatch):
        monkeypatch.setenv("REDIS_HOST", "10.0.0.1")
        monkeypatch.setenv("REDIS_PORT", "16379")
        monkeypatch.delenv("REDIS_PASSWORD", raising=False)
        url = get_redis_url()
        assert url == "redis://10.0.0.1:16379"

    def test_empty_password_is_omitted(self, monkeypatch):
        monkeypatch.setenv("REDIS_HOST", "localhost")
        monkeypatch.setenv("REDIS_PORT", "6379")
        monkeypatch.setenv("REDIS_PASSWORD", "")
        url = get_redis_url()
        assert url == "redis://localhost:6379"

    def test_custom_port_only(self, monkeypatch):
        monkeypatch.setenv("REDIS_PORT", "6380")
        monkeypatch.delenv("REDIS_HOST", raising=False)
        monkeypatch.delenv("REDIS_PASSWORD", raising=False)
        url = get_redis_url()
        assert url == "redis://localhost:6380"

    def test_host_only(self, monkeypatch):
        monkeypatch.setenv("REDIS_HOST", "myredis")
        monkeypatch.delenv("REDIS_PORT", raising=False)
        monkeypatch.delenv("REDIS_PASSWORD", raising=False)
        url = get_redis_url()
        assert url == "redis://myredis:6379"


class TestGetEnv:
    def test_key_exists(self, monkeypatch):
        monkeypatch.setenv("MY_KEY", "my_value")
        assert get_env("MY_KEY") == "my_value"

    def test_missing_with_default(self):
        assert get_env("NONEXISTENT", "fallback") == "fallback"

    def test_missing_without_default_raises_error(self):
        with pytest.raises(RuntimeError, match="Missing required environment variable: NONEXISTENT"):
            get_env("NONEXISTENT")

    def test_empty_string_as_value(self, monkeypatch):
        monkeypatch.setenv("EMPTY_KEY", "")
        assert get_env("EMPTY_KEY") == ""

    def test_default_overrides_env_value(self, monkeypatch):
        monkeypatch.setenv("EXISTING_KEY", "real_value")
        assert get_env("EXISTING_KEY", "default_value") == "real_value"
