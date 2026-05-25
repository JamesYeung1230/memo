"""
Core service unit test - KnowledgeClient method signatures.

Strategy: Use MagicMock to simulate httpx.AsyncClient responses.
Verify each method:
  1. Calls the correct URL path
  2. Returns the expected data structure
  3. Raises KnowledgeServiceException on error responses
"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from services.core.clients.knowledge import KnowledgeClient
from shared.errors import KnowledgeServiceException


@pytest.fixture
def mock_client():
    """Build a KnowledgeClient with a mocked httpx.AsyncClient."""
    client = KnowledgeClient(base_url="http://test-knowledge:8002")
    client.client = AsyncMock(spec=httpx.AsyncClient)
    return client


# ============================================================
# Helper
# ============================================================

def _ok_response(data: dict | list) -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.is_success = True
    resp.json.return_value = {"code": 0, "message": "success", "data": data}
    return resp


def _error_response(status_code: int = 500) -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.is_success = False
    resp.status_code = status_code
    resp.json.return_value = {
        "error": {"code": "KNOWLEDGE_INTERNAL_ERROR", "message": "Internal error"},
    }
    return resp


# ============================================================
# Content Query
# ============================================================

class TestContentQuery:
    """24 methods: get_domains, get_chapters, get_cards, get_card_detail, get_question"""

    async def test_get_domains(self, mock_client):
        mock_client.client.get.return_value = _ok_response([{"id": "d1"}])
        result = await mock_client.get_domains()
        mock_client.client.get.assert_called_once_with("/api/v1/domains", params={"status": "published"})
        assert result == [{"id": "d1"}]

    async def test_get_domains_error(self, mock_client):
        mock_client.client.get.return_value = _error_response()
        with pytest.raises(KnowledgeServiceException):
            await mock_client.get_domains()

    async def test_get_chapters(self, mock_client):
        mock_client.client.get.return_value = _ok_response([{"id": "ch1"}])
        result = await mock_client.get_chapters("domain-1")
        mock_client.client.get.assert_called_once_with("/api/v1/domains/domain-1/chapters", params={"status": "published"})
        assert result == [{"id": "ch1"}]

    async def test_get_cards(self, mock_client):
        mock_client.client.get.return_value = _ok_response([{"id": "c1"}])
        result = await mock_client.get_cards("ch-1")
        mock_client.client.get.assert_called_once_with("/api/v1/chapters/ch-1/cards", params={"status": "published"})
        assert result == [{"id": "c1"}]

    async def test_get_card_detail(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"id": "c1", "title": "test"})
        result = await mock_client.get_card_detail("c1")
        mock_client.client.get.assert_called_once_with("/api/v1/cards/c1")
        assert result["title"] == "test"

    async def test_get_question(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"id": "q1"})
        result = await mock_client.get_question("c1")
        mock_client.client.get.assert_called_once_with("/api/v1/cards/c1/question")
        assert result["id"] == "q1"


# ============================================================
# Content Management
# ============================================================

class TestContentManagement:
    """7 methods: create/update/delete/reorder/toggle domain"""

    async def test_create_domain(self, mock_client):
        data = {"name": "new-domain", "icon": "test"}
        mock_client.client.post.return_value = _ok_response({"id": "d1"})
        result = await mock_client.create_domain(data)
        mock_client.client.post.assert_called_once_with("/api/v1/domains", json=data)
        assert result["id"] == "d1"

    async def test_update_domain(self, mock_client):
        data = {"name": "updated"}
        mock_client.client.put.return_value = _ok_response({"id": "d1"})
        result = await mock_client.update_domain("d1", data)
        mock_client.client.put.assert_called_once_with("/api/v1/domains/d1", json=data)
        assert result["id"] == "d1"

    async def test_delete_domain(self, mock_client):
        mock_client.client.delete.return_value = MagicMock(spec=httpx.Response, status_code=204)
        mock_client.client.delete.return_value.raise_for_status = MagicMock()
        await mock_client.delete_domain("d1")
        mock_client.client.delete.assert_called_once_with("/api/v1/domains/d1")

    async def test_reorder_domains(self, mock_client):
        order = ["d1", "d2"]
        mock_client.client.put.return_value = _ok_response({"order": order})
        result = await mock_client.reorder_domains(order)
        mock_client.client.put.assert_called_once_with("/api/v1/domains/reorder", json={"order": order})
        assert result["order"] == order

    async def test_toggle_domain_status(self, mock_client):
        mock_client.client.put.return_value = _ok_response({"id": "d1", "status": "draft"})
        result = await mock_client.toggle_domain_status("d1")
        mock_client.client.put.assert_called_once_with("/api/v1/domains/d1/toggle-status")
        assert result["status"] == "draft"


# ============================================================
# Chapter Management
# ============================================================

class TestChapterManagement:
    """6 methods: list/create/get/update/delete/reorder chapter"""

    async def test_list_chapters(self, mock_client):
        mock_client.client.get.return_value = _ok_response([{"id": "ch1"}])
        result = await mock_client.list_chapters("d1")
        mock_client.client.get.assert_called_once_with("/api/v1/domains/d1/chapters")
        assert result == [{"id": "ch1"}]

    async def test_create_chapter(self, mock_client):
        data = {"domain_id": "d1", "name": "new-chapter"}
        mock_client.client.post.return_value = _ok_response({"id": "ch1"})
        result = await mock_client.create_chapter(data)
        mock_client.client.post.assert_called_once_with("/api/v1/chapters", json=data)

    async def test_get_chapter_detail(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"id": "ch1"})
        result = await mock_client.get_chapter_detail("ch1")
        mock_client.client.get.assert_called_once_with("/api/v1/chapters/ch1")

    async def test_update_chapter(self, mock_client):
        data = {"name": "updated"}
        mock_client.client.put.return_value = _ok_response({"id": "ch1"})
        result = await mock_client.update_chapter("ch1", data)
        mock_client.client.put.assert_called_once_with("/api/v1/chapters/ch1", json=data)

    async def test_delete_chapter(self, mock_client):
        mock_client.client.delete.return_value = MagicMock(spec=httpx.Response, status_code=204)
        mock_client.client.delete.return_value.raise_for_status = MagicMock()
        await mock_client.delete_chapter("ch1")
        mock_client.client.delete.assert_called_once_with("/api/v1/chapters/ch1")

    async def test_reorder_chapters(self, mock_client):
        order = ["ch1", "ch2"]
        mock_client.client.put.return_value = _ok_response({"order": order})
        result = await mock_client.reorder_chapters(order)
        mock_client.client.put.assert_called_once_with("/api/v1/chapters/reorder", json={"order": order})


# ============================================================
# Card Management
# ============================================================

class TestCardManagement:
    """5 methods: list/create/update/delete/toggle card"""

    async def test_list_cards(self, mock_client):
        mock_client.client.get.return_value = _ok_response([{"id": "c1"}])
        result = await mock_client.list_cards("ch1")
        mock_client.client.get.assert_called_once_with("/api/v1/chapters/ch1/cards", params={"status": "all"})
        assert result == [{"id": "c1"}]

    async def test_list_cards_with_keyword(self, mock_client):
        mock_client.client.get.return_value = _ok_response([{"id": "c1"}])
        result = await mock_client.list_cards("ch1", keyword="test")
        mock_client.client.get.assert_called_once_with("/api/v1/chapters/ch1/cards", params={"status": "all", "keyword": "test"})

    async def test_create_card(self, mock_client):
        data = {"chapter_id": "ch1", "title": "new-card"}
        mock_client.client.post.return_value = _ok_response({"id": "c1"})
        result = await mock_client.create_card(data)
        mock_client.client.post.assert_called_once_with("/api/v1/cards", json=data)

    async def test_update_card(self, mock_client):
        data = {"title": "updated"}
        mock_client.client.put.return_value = _ok_response({"id": "c1"})
        result = await mock_client.update_card("c1", data)
        mock_client.client.put.assert_called_once_with("/api/v1/cards/c1", json=data)

    async def test_delete_card(self, mock_client):
        mock_client.client.delete.return_value = MagicMock(spec=httpx.Response, status_code=204)
        mock_client.client.delete.return_value.raise_for_status = MagicMock()
        await mock_client.delete_card("c1")
        mock_client.client.delete.assert_called_once_with("/api/v1/cards/c1")

    async def test_toggle_card_status(self, mock_client):
        mock_client.client.put.return_value = _ok_response({"id": "c1", "status": "draft"})
        result = await mock_client.toggle_card_status("c1", "draft")
        mock_client.client.put.assert_called_once_with("/api/v1/cards/c1/toggle-status", json={"status": "draft"})


# ============================================================
# Question Management
# ============================================================

class TestQuestionManagement:
    """5 methods: get_card_question/create/get/update/delete"""

    async def test_get_card_question(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"id": "q1"})
        result = await mock_client.get_card_question("c1")
        mock_client.client.get.assert_called_once_with("/api/v1/cards/c1/question")

    async def test_create_question(self, mock_client):
        data = {"card_id": "c1", "question_text": "test?"}
        mock_client.client.post.return_value = _ok_response({"id": "q1"})
        result = await mock_client.create_question(data)
        mock_client.client.post.assert_called_once_with("/api/v1/questions", json=data)

    async def test_get_question_detail(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"id": "q1"})
        result = await mock_client.get_question_detail("q1")
        mock_client.client.get.assert_called_once_with("/api/v1/questions/q1")

    async def test_update_question(self, mock_client):
        data = {"question_text": "updated?"}
        mock_client.client.put.return_value = _ok_response({"id": "q1"})
        result = await mock_client.update_question("q1", data)
        mock_client.client.put.assert_called_once_with("/api/v1/questions/q1", json=data)

    async def test_delete_question(self, mock_client):
        mock_client.client.delete.return_value = MagicMock(spec=httpx.Response, status_code=204)
        mock_client.client.delete.return_value.raise_for_status = MagicMock()
        await mock_client.delete_question("q1")
        mock_client.client.delete.assert_called_once_with("/api/v1/questions/q1")


# ============================================================
# AI Generation
# ============================================================

class TestAIGeneration:
    """4 methods: generate_cards sync/async, get_result, generate_question"""

    async def test_generate_cards_sync(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"cards": []})
        result = await mock_client.generate_cards_sync(["topic1"], "ch1")
        call_kwargs = mock_client.client.post.call_args[1]
        assert call_kwargs["json"]["mode"] == "sync"
        assert call_kwargs["json"]["topics"] == ["topic1"]

    async def test_generate_cards_async(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"task_id": "t1"})
        result = await mock_client.generate_cards_async(["topic1"], "ch1")
        assert result["task_id"] == "t1"

    async def test_get_generate_cards_result(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"status": "completed"})
        result = await mock_client.get_generate_cards_result("t1")
        mock_client.client.get.assert_called_once_with("/api/v1/ai/generate-cards/t1/result")

    async def test_generate_question(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"id": "q1"})
        result = await mock_client.generate_question("c1")
        mock_client.client.post.assert_called_once()
        call_kwargs = mock_client.client.post.call_args[1]
        assert call_kwargs["json"]["mode"] == "sync"


# ============================================================
# Sensitive Words
# ============================================================

class TestSensitiveWords:
    """6 methods: list/create/update/delete/batch_delete/toggle/reload"""

    async def test_list_sensitive_words(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"items": [], "total": 0})
        result = await mock_client.list_sensitive_words()
        mock_client.client.get.assert_called_once_with("/api/v1/sensitive-words", params={"page": 1, "page_size": 20})

    async def test_create_sensitive_word(self, mock_client):
        data = {"word": "badword", "match_mode": "exact"}
        mock_client.client.post.return_value = _ok_response({"id": "w1"})
        result = await mock_client.create_sensitive_word(data)
        mock_client.client.post.assert_called_once_with("/api/v1/sensitive-words", json=data)

    async def test_update_sensitive_word(self, mock_client):
        data = {"word": "updated"}
        mock_client.client.put.return_value = _ok_response({"id": "w1"})
        result = await mock_client.update_sensitive_word("w1", data)
        mock_client.client.put.assert_called_once_with("/api/v1/sensitive-words/w1", json=data)

    async def test_delete_sensitive_word(self, mock_client):
        mock_client.client.delete.return_value = MagicMock(spec=httpx.Response, status_code=204)
        mock_client.client.delete.return_value.raise_for_status = MagicMock()
        await mock_client.delete_sensitive_word("w1")
        mock_client.client.delete.assert_called_once_with("/api/v1/sensitive-words/w1")

    async def test_batch_delete_sensitive_words(self, mock_client):
        mock_client.client.post.return_value = MagicMock(spec=httpx.Response, status_code=204)
        mock_client.client.post.return_value.raise_for_status = MagicMock()
        await mock_client.batch_delete_sensitive_words(["w1", "w2"])
        mock_client.client.post.assert_called_once_with("/api/v1/sensitive-words/batch-delete", json={"ids": ["w1", "w2"]})

    async def test_toggle_sensitive_word(self, mock_client):
        mock_client.client.put.return_value = _ok_response({"id": "w1", "enabled": False})
        result = await mock_client.toggle_sensitive_word("w1", False)
        mock_client.client.put.assert_called_once_with("/api/v1/sensitive-words/w1/toggle", json={"enabled": False})

    async def test_reload_sensitive_words(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"message": "reloaded"})
        result = await mock_client.reload_sensitive_words()
        mock_client.client.post.assert_called_once_with("/api/v1/sensitive-words/reload")


# ============================================================
# Review Pipeline
# ============================================================

class TestReviewPipeline:
    """10 methods: submit/get_status/get_detail/approve/reject/batch_approve/batch_reject/queue/records/statistics"""

    async def test_submit_review(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"review_id": "r1"})
        result = await mock_client.submit_review("n1", "title", "content", "author1")
        call_kwargs = mock_client.client.post.call_args[1]
        assert call_kwargs["json"]["note_id"] == "n1"
        assert call_kwargs["json"]["author_id"] == "author1"

    async def test_get_review_status(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"status": "pending"})
        result = await mock_client.get_review_status("n1")
        mock_client.client.get.assert_called_once_with("/api/v1/review/notes/n1/status")

    async def test_get_review_detail(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"detail": {"score": 85}})
        result = await mock_client.get_review_detail("n1")
        mock_client.client.get.assert_called_once_with("/api/v1/review/notes/n1/detail")

    async def test_approve_review(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"status": "approved"})
        result = await mock_client.approve_review("r1", "reviewer1")
        mock_client.client.post.assert_called_once_with("/api/v1/review/notes/r1/approve", json={"reviewer": "reviewer1"})

    async def test_reject_review(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"status": "rejected"})
        result = await mock_client.reject_review("r1", "reviewer1", "bad content")
        mock_client.client.post.assert_called_once_with("/api/v1/review/notes/r1/reject", json={"reviewer": "reviewer1", "reason": "bad content"})

    async def test_batch_approve_review(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"approved": 2})
        result = await mock_client.batch_approve_review(["r1", "r2"], "reviewer1")
        mock_client.client.post.assert_called_once_with("/api/v1/review/batch-approve", json={"review_ids": ["r1", "r2"], "reviewer": "reviewer1"})

    async def test_batch_reject_review(self, mock_client):
        mock_client.client.post.return_value = _ok_response({"rejected": 2})
        result = await mock_client.batch_reject_review(["r1", "r2"], "reviewer1", "spam")
        mock_client.client.post.assert_called_once_with("/api/v1/review/batch-reject", json={"review_ids": ["r1", "r2"], "reviewer": "reviewer1", "reason": "spam"})

    async def test_get_review_queue(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"items": [], "total": 0})
        result = await mock_client.get_review_queue()
        mock_client.client.get.assert_called_once_with("/api/v1/review/queue", params={"page": 1, "page_size": 20})

    async def test_get_review_records(self, mock_client):
        mock_client.client.get.return_value = _ok_response([])
        result = await mock_client.get_review_records("approved")
        mock_client.client.get.assert_called_once_with("/api/v1/review/records", params={"status": "approved"})

    async def test_get_review_statistics(self, mock_client):
        mock_client.client.get.return_value = _ok_response({"total": 100})
        result = await mock_client.get_review_statistics()
        mock_client.client.get.assert_called_once_with("/api/v1/review/statistics")


class TestClose:
    async def test_close(self, mock_client):
        mock_client.client.aclose = AsyncMock()
        await mock_client.close()
        mock_client.client.aclose.assert_called_once()
