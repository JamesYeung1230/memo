import uuid

import pytest

from tests.conftest import assert_success_structure


@pytest.mark.knowledge
class TestReviewPipeline:

    def test_submit_review(self, anonymous_client):
        """Submit a note for review - should pass through pipeline"""
        note_id = str(uuid.uuid4())
        resp = anonymous_client.post(f"/review/notes/{note_id}/submit", json={
            "note_id": note_id,
            "title": "Python variable learning notes",
            "content": "Today I learned about Python variables. Variables are containers for storing data.",
            "author_id": "openid_123",
        })
        assert resp.status_code == 200
        assert_success_structure(resp)
        data = resp.body["data"]
        assert "review_id" in data
        assert data["status"] in ("approved", "pending_manual", "rejected")

    def test_submit_review_sensitive_hit(self, anonymous_client):
        """Submit with sensitive content - should be rejected"""
        note_id = str(uuid.uuid4())
        resp = anonymous_client.post(f"/review/notes/{note_id}/submit", json={
            "note_id": note_id,
            "title": "广告",
            "content": "联系微信xxx, 代写作业收费",
            "author_id": "openid_456",
        })
        assert resp.status_code == 200
        data = resp.body["data"]
        assert data["status"] == "rejected"

    def test_get_review_status(self, anonymous_client):
        note_id = str(uuid.uuid4())
        resubmit_resp = anonymous_client.post(f"/review/notes/{note_id}/submit", json={
            "note_id": note_id,
            "title": "Test",
            "content": "Normal content for status check",
            "author_id": "openid_789",
        })
        review_id = resubmit_resp.body["data"]["review_id"]

        resp = anonymous_client.get(f"/review/notes/{note_id}/status")
        assert resp.status_code == 200
        assert resp.body["data"]["review_id"] == review_id

    def test_get_review_detail(self, anonymous_client):
        note_id = str(uuid.uuid4())
        anonymous_client.post(f"/review/notes/{note_id}/submit", json={
            "note_id": note_id,
            "title": "Detail Test",
            "content": "Content for detail check",
            "author_id": "openid_101",
        })

        resp = anonymous_client.get(f"/review/notes/{note_id}/detail")
        assert resp.status_code == 200
        assert "review_id" in resp.body["data"]

    def test_get_review_queue(self, anonymous_client):
        resp = anonymous_client.get("/review/queue", params={"page": 1, "page_size": 20})
        assert resp.status_code == 200

    def test_get_review_records(self, anonymous_client):
        resp = anonymous_client.get("/review/records", params={"page": 1, "page_size": 20})
        assert resp.status_code == 200

    def test_get_review_statistics(self, anonymous_client):
        resp = anonymous_client.get("/review/statistics")
        assert resp.status_code == 200
        assert "today_pending" in resp.body["data"]
