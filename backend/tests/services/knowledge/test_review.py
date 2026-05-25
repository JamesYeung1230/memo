"""
Review route unit tests - Mock DB + Mock AIProvider.
Covers 10 endpoints x success/error paths.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from services.knowledge.routes.review import router
from shared.errors import AppException


def _mock_result(**kwargs):
    r = MagicMock()
    for k, v in kwargs.items():
        if k == "scalars_all":
            s = MagicMock()
            s.all = MagicMock(return_value=v)
            r.scalars = MagicMock(return_value=s)
        elif k == "scalar":
            r.scalar = MagicMock(return_value=v)
        elif k == "scalar_one_or_none":
            r.scalar_one_or_none = MagicMock(return_value=v)
        elif k == "one_or_none":
            r.one_or_none = MagicMock(return_value=v)
    return r


@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.add = MagicMock()
    session.delete = AsyncMock()
    session.commit = AsyncMock(return_value=None)
    session.refresh = AsyncMock(return_value=None)
    session.execute = AsyncMock(return_value=_mock_result())
    return session


@pytest.fixture
def mock_review():
    r = MagicMock()
    r.id = str(uuid.uuid4())
    r.note_id = str(uuid.uuid4())
    r.author_id = "openid_123"
    r.note_title = "test note"
    r.note_content = "test content"
    r.status = "pending_manual"
    r.risk_score = 50
    r.risk_labels = []
    r.sensitive_words_hit = []
    r.ai_risk_score = 50
    r.ai_risk_labels = []
    r.ai_reasoning = "needs review"
    r.needs_manual_review = True
    r.ai_status = "normal"
    r.manual_reviewer = None
    r.manual_result = None
    r.manual_reason = None
    r.reviewed_at = None
    r.created_at = None
    r.updated_at = None
    return r


@pytest.fixture
def mock_sensitive_word():
    w = MagicMock()
    w.word = "badword"
    w.match_mode = "exact"
    return w


@pytest.fixture
def client(mock_session):
    app = FastAPI()
    app.include_router(router)

    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    app.state.db_session_factory = MagicMock(return_value=mock_session)

    @app.exception_handler(AppException)
    async def app_exc_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.http_status,
            content={**exc.to_dict(), "request_id": ""},
        )

    @app.exception_handler(RequestValidationError)
    async def val_exc_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={
            "code": "VALIDATION_ERROR", "message": "Request validation failed",
            "data": None, "detail": {"errors": []}, "request_id": "",
        })

    return TestClient(app)


class TestReviewRoutes:

    def test_submit_review_approved(self, client, mock_session, mock_sensitive_word):
        """Submit - no sensitive hit, AI approves"""
        mock_session.execute.side_effect = [
            _mock_result(scalars_all=[mock_sensitive_word]),  # sensitive check
            _mock_result(scalar_one_or_none=MagicMock()),  # not used
        ]
        mock_session.refresh = AsyncMock(side_effect=lambda x: setattr(x, 'id', str(uuid.uuid4())))
        resp = client.post("/api/v1/review/notes/test-note-id/submit", json={
            "note_id": "test-note-id",
            "title": "test",
            "content": "good content",
            "author_id": "openid_123",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] in ("approved", "pending_manual")

    def test_submit_review_sensitive_hit(self, client, mock_session, mock_sensitive_word):
        """Submit - sensitive word hit -> rejected"""
        mock_sensitive_word.word = "广告"
        mock_session.execute.return_value = _mock_result(scalars_all=[mock_sensitive_word])
        mock_session.refresh = AsyncMock(side_effect=lambda x: setattr(x, 'id', str(uuid.uuid4())))
        resp = client.post("/api/v1/review/notes/test-note-id/submit", json={
            "note_id": "test-note-id",
            "title": "test",
            "content": "联系微信广告",
            "author_id": "openid_123",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "rejected"

    def test_get_review_status(self, client, mock_session, mock_review):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_review)
        resp = client.get("/api/v1/review/notes/test-note-id/status")
        assert resp.status_code == 200
        assert resp.json()["data"]["review_id"] == mock_review.id

    def test_get_review_status_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/review/notes/test-note-id/status")
        assert resp.status_code == 404

    def test_get_review_detail(self, client, mock_session, mock_review):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_review)
        resp = client.get("/api/v1/review/notes/test-note-id/detail")
        assert resp.status_code == 200

    def test_get_review_detail_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/review/notes/test-note-id/detail")
        assert resp.status_code == 404

    def test_approve_review(self, client, mock_session, mock_review):
        mock_review.status = "pending_manual"
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_review)
        resp = client.post("/api/v1/review/notes/test-note-id/approve", json={
            "reviewer": "admin",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "approved"

    def test_approve_review_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/review/notes/test-note-id/approve", json={
            "reviewer": "admin",
        })
        assert resp.status_code == 404

    def test_reject_review(self, client, mock_session, mock_review):
        mock_review.status = "pending_manual"
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_review)
        resp = client.post("/api/v1/review/notes/test-note-id/reject", json={
            "reviewer": "admin",
            "reason": "inappropriate content",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "rejected"

    def test_reject_review_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/review/notes/test-note-id/reject", json={
            "reviewer": "admin",
            "reason": "bad",
        })
        assert resp.status_code == 404

    def test_batch_approve(self, client, mock_session, mock_review):
        mock_review.status = "pending_manual"
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_review)
        resp = client.post("/api/v1/review/batch-approve", json={
            "review_ids": [mock_review.id],
            "reviewer": "admin",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["processed_count"] == 1

    def test_batch_reject(self, client, mock_session, mock_review):
        mock_review.status = "pending_manual"
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_review)
        resp = client.post("/api/v1/review/batch-reject", json={
            "review_ids": [mock_review.id],
            "reviewer": "admin",
            "reason": "bad",
        })
        assert resp.status_code == 200

    def test_get_review_queue(self, client, mock_session, mock_review):
        mock_session.execute.return_value = _mock_result(scalar=1, scalars_all=[mock_review])
        resp = client.get("/api/v1/review/queue?page=1&page_size=20")
        assert resp.status_code == 200
        assert resp.json()["meta"]["total"] == 1

    def test_get_review_records(self, client, mock_session, mock_review):
        mock_session.execute.return_value = _mock_result(scalar=1, scalars_all=[mock_review])
        resp = client.get("/api/v1/review/records?page=1&page_size=20")
        assert resp.status_code == 200

    def test_get_review_statistics(self, client, mock_session):
        """Mock the two execute calls with proper scalar values"""
        mock_row1 = MagicMock()
        mock_row1.pending = 5
        mock_row1.reviewed = 10

        mock_row2 = MagicMock()
        mock_row2.approved = 8
        mock_row2.total = 10

        mock_session.execute.side_effect = [
            _mock_result(one_or_none=mock_row1),  # today stats
            _mock_result(one_or_none=mock_row2),  # weekly stats
        ]
        resp = client.get("/api/v1/review/statistics")
        assert resp.status_code == 200
        assert resp.json()["data"]["today_pending"] == 5
