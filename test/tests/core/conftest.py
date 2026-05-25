import os
import uuid

import pytest

from tests.utils.client import ApiClient


@pytest.fixture(scope="session")
def core_base_url() -> str:
    return os.getenv("CORE_BASE_URL", "http://localhost:8000/api/v1")


@pytest.fixture(scope="session")
def anonymous_client(core_base_url: str) -> ApiClient:
    client = ApiClient(core_base_url)
    yield client
    client.close()


@pytest.fixture(scope="function")
def unique_user_id() -> str:
    return f"test-user-{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="function")
def unique_note_title() -> str:
    return f"test-note-{uuid.uuid4().hex[:8]}"
