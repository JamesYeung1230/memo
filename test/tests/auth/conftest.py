import uuid

import pytest

from tests.conftest import WX_MOCK_ENABLED
from tests.utils.client import ApiClient


@pytest.fixture
def wechat_new_code() -> str:
    return f"new_user_{uuid.uuid4().hex[:8]}"


@pytest.fixture
def wechat_existing_code() -> str:
    return "existing_user_code_001"


def require_mock_mode():
    if not WX_MOCK_ENABLED:
        pytest.skip("WX_MOCK_MODE is not enabled")


def wechat_client(base_url: str) -> ApiClient:
    return ApiClient(base_url)
