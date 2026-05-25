import os

from .base import AIProvider
from .deepseek_provider import DeepSeekProvider
from .mock_provider import MockProvider


def get_provider() -> AIProvider:
    mock_mode = os.environ.get("AI_MOCK_MODE", "false").lower() in ("true", "1", "yes")
    if mock_mode:
        return MockProvider()
    return DeepSeekProvider(
        api_key=os.environ["DEEPSEEK_API_KEY"],
        base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
    )
