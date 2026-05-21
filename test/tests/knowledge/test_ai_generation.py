import pytest

from tests.conftest import assert_success_structure


@pytest.mark.knowledge
class TestAIGenerateCards:

    def test_generate_cards_sync(self, anonymous_client, test_domain_with_chapter):
        """Sync mode: generates cards and returns results"""
        _, chapter = test_domain_with_chapter
        resp = anonymous_client.post("/ai/generate-cards", json={
            "topics": ["variable", "function"],
            "chapter_id": chapter["id"],
            "mode": "sync",
        })
        assert resp.status_code == 200
        assert_success_structure(resp)
        data = resp.body["data"]
        assert "results" in data
        assert len(data["results"]) == 2
        for r in data["results"]:
            assert "title" in r
            assert "core_concept" in r
            assert "status" in r

    def test_generate_cards_async(self, anonymous_client, test_domain_with_chapter):
        """Async mode: returns task_id"""
        _, chapter = test_domain_with_chapter
        resp = anonymous_client.post("/ai/generate-cards", json={
            "topics": ["variable"],
            "chapter_id": chapter["id"],
            "mode": "async",
        })
        assert resp.status_code == 200
        data = resp.body["data"]
        assert data["status"] == "processing"
        assert "task_id" in data

    def test_poll_generate_result(self, anonymous_client, test_domain_with_chapter):
        """Poll async task result"""
        _, chapter = test_domain_with_chapter
        # Create async task first
        create_resp = anonymous_client.post("/ai/generate-cards", json={
            "topics": ["variable"],
            "chapter_id": chapter["id"],
            "mode": "async",
        })
        task_id = create_resp.body["data"]["task_id"]

        resp = anonymous_client.get(f"/ai/generate-cards/{task_id}/result")
        assert resp.status_code == 200
        # In mock mode, task should still be processing
        assert resp.body["data"]["task_id"] == task_id
