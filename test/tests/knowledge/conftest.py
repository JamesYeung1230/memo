import os
import uuid

import pytest

from tests.utils.client import ApiClient


@pytest.fixture(scope="session")
def knowledge_base_url() -> str:
    return os.getenv("KNOWLEDGE_BASE_URL", "http://192.168.234.128:8002/api/v1")


@pytest.fixture(scope="session")
def anonymous_client(knowledge_base_url: str) -> ApiClient:
    client = ApiClient(knowledge_base_url)
    yield client
    client.close()


@pytest.fixture(scope="function")
def unique_domain_name() -> str:
    return f"test-domain-{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="function")
def unique_chapter_name() -> str:
    return f"test-chapter-{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="function")
def unique_card_title() -> str:
    return f"test-card-{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="function")
def test_domain(anonymous_client: ApiClient, unique_domain_name: str) -> dict:
    resp = anonymous_client.post("/domains", json={
        "name": unique_domain_name,
        "icon": "test",
        "is_free": True,
        "status": "published",
    })
    assert resp.status_code == 201
    domain = resp.body["data"]
    yield domain
    # cleanup
    resp = anonymous_client.delete(f"/domains/{domain['id']}")
    assert resp.status_code == 204


@pytest.fixture(scope="function")
def test_domain_with_chapter(anonymous_client: ApiClient, test_domain: dict, unique_chapter_name: str) -> tuple[dict, dict]:
    resp = anonymous_client.post("/chapters", json={
        "domain_id": test_domain["id"],
        "name": unique_chapter_name,
        "status": "published",
    })
    assert resp.status_code == 201
    chapter = resp.body["data"]
    yield test_domain, chapter
    resp = anonymous_client.delete(f"/chapters/{chapter['id']}")
    assert resp.status_code == 204
