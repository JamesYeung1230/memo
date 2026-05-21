"""
C2 Learning + Quiz route unit tests - Mock DB + Mock KnowledgeClient.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from services.core.routes.learning import router as learning_router
from services.core.routes.notes import router as notes_router
from services.core.routes.points import router as points_router
from services.core.routes.quiz import router as quiz_router
from services.core.routes.review import router as review_router
from services.core.clients import KnowledgeClient
from services.core.models import Config, Note, PointsRecord
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
def mock_knowledge_client():
    client = MagicMock(spec=KnowledgeClient)
    client.get_domains = AsyncMock(return_value=[{"id": str(uuid.uuid4()), "name": "test", "is_free": True}])
    client.get_chapters = AsyncMock(return_value=[{"id": str(uuid.uuid4()), "name": "ch1"}])
    client.get_cards = AsyncMock(return_value=[{"id": str(uuid.uuid4()), "title": "card1"}])
    client.get_card_detail = AsyncMock(return_value={"id": str(uuid.uuid4()), "title": "test", "chapter_id": str(uuid.uuid4())})
    client.get_question_detail = AsyncMock(return_value={
        "question_text": "test?",
        "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
        "correct_option": "A",
        "explanation": "test",
    })
    client.get_review_queue = AsyncMock(return_value=[])
    client.close = AsyncMock()
    return client


@pytest.fixture
def mock_redis():
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.incr = AsyncMock(return_value=1)
    redis.expire = AsyncMock(return_value=True)
    return redis


@pytest.fixture
def client(mock_session, mock_knowledge_client, mock_redis):
    app = FastAPI()
    app.include_router(learning_router)
    app.include_router(notes_router)
    app.include_router(points_router)
    app.include_router(quiz_router)
    app.include_router(review_router)

    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    app.state.db_session_factory = MagicMock(return_value=mock_session)
    app.state.knowledge_client = mock_knowledge_client
    app.state.redis = mock_redis

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


class TestLearningRoutes:

    def test_get_domains(self, client):
        resp = client.get("/api/v1/learn/domains")
        assert resp.status_code == 200
        assert len(resp.json()["data"]) > 0

    def test_get_chapters(self, client):
        resp = client.get(f"/api/v1/learn/domains/{uuid.uuid4()}/chapters")
        assert resp.status_code == 200

    def test_get_cards(self, client, mock_session):
        mock_session.execute.return_value = _mock_result()
        resp = client.get(f"/api/v1/learn/chapters/{uuid.uuid4()}/cards")
        assert resp.status_code == 200

    def test_get_card_detail(self, client, mock_knowledge_client):
        card_id = str(uuid.uuid4())
        resp = client.get(f"/api/v1/learn/cards/{card_id}")
        assert resp.status_code == 200

    def test_master_card(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post(f"/api/v1/learn/cards/{uuid.uuid4()}/master")
        assert resp.status_code == 200

    def test_get_progress(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar=5)
        resp = client.get("/api/v1/learn/progress")
        assert resp.status_code == 200
        assert resp.json()["data"]["total_learned"] == 5

    def test_toggle_favorite_add(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post(f"/api/v1/learn/cards/{uuid.uuid4()}/favorite")
        assert resp.status_code == 200
        assert resp.json()["data"]["favorited"] is True

    def test_toggle_favorite_remove(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=MagicMock())
        resp = client.post(f"/api/v1/learn/cards/{uuid.uuid4()}/favorite")
        assert resp.status_code == 200
        assert resp.json()["data"]["favorited"] is False

    def test_get_favorites(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalars_all=[])
        resp = client.get("/api/v1/learn/favorites")
        assert resp.status_code == 200


class TestQuizRoutes:

    def test_submit_answer_correct(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/quiz/submit", json={
            "question_id": str(uuid.uuid4()),
            "selected_option": "A",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["correct"] is True

    def test_submit_answer_wrong(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/quiz/submit", json={
            "question_id": str(uuid.uuid4()),
            "selected_option": "B",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["correct"] is False

    def test_get_daily_challenge(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/quiz/daily-challenge")
        assert resp.status_code == 200

    def test_get_quiz_statistics(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar=10)
        resp = client.get("/api/v1/quiz/statistics")
        assert resp.status_code == 200

    def test_get_wrong_questions(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalars_all=[])
        resp = client.get("/api/v1/quiz/wrong-questions")
        assert resp.status_code == 200


class TestReviewRoutes:

    def test_get_today_review(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        # First call: get_or_create config (no config exists)
        # Second call: select learning records
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=None),  # config not found
            _mock_result(scalars_all=[]),  # no learning records
        ]
        resp = client.get("/api/v1/review/today")
        assert resp.status_code == 200

    def test_get_config(self, client, mock_session):
        config = MagicMock()
        config.review_nodes = [1, 2, 4, 7, 15]
        config.daily_limit = 20
        config.forgotten_alert_days = 7
        config.reminder_time = "20:00"
        config.weekend_quiet = False
        config.preset = None
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.get("/api/v1/review/config")
        assert resp.status_code == 200
        assert resp.json()["data"]["daily_limit"] == 20

    def test_update_config(self, client, mock_session):
        config = MagicMock()
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.put("/api/v1/review/config", json={"daily_limit": 30})
        assert resp.status_code == 200

    def test_reset_config(self, client, mock_session):
        config = MagicMock()
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.post("/api/v1/review/config/reset")
        assert resp.status_code == 200

    def test_get_forgotten(self, client, mock_session):
        config = MagicMock()
        config.forgotten_alert_days = 7
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=config),
            _mock_result(scalars_all=[]),
        ]
        resp = client.get("/api/v1/review/forgotten")
        assert resp.status_code == 200

    def test_get_notes_review(self, client, mock_session, mock_knowledge_client):
        mock_knowledge_client.get_review_records = AsyncMock(return_value=[])
        resp = client.get("/api/v1/review/notes")
        assert resp.status_code == 200


class TestNoteRoutes:

    def _make_mock_note(self, **overrides) -> MagicMock:
        """Helper to create a mock Note instance with defaults."""
        note = MagicMock(spec=Note)
        note.id = str(uuid.uuid4())
        note.user_id = "anonymous"
        note.title = "测试笔记"
        note.content = "这是笔记正文内容"
        note.tags = ["编程", "Python"]
        note.associated_card_id = None
        note.audit_status = "draft"
        note.reject_reason = None
        note.violation_flag = False
        note.submitted_at = None
        note.created_at = "2026-05-20 10:00:00+00"
        note.updated_at = "2026-05-20 10:00:00+00"
        note.deleted_at = None
        for k, v in overrides.items():
            setattr(note, k, v)
        return note

    def test_create_note(self, client, mock_session):
        resp = client.post("/api/v1/notes", json={
            "title": "测试笔记",
            "content": "这是笔记正文内容",
            "tags": ["编程", "Python"],
            "card_id": str(uuid.uuid4()),
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "id" in data

    def test_list_notes(self, client, mock_session):
        mock_note = self._make_mock_note()
        mock_session.execute.side_effect = [
            _mock_result(scalar=1),
            _mock_result(scalars_all=[mock_note]),
        ]
        resp = client.get("/api/v1/notes")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == 1
        assert body["meta"]["total"] == 1

    def test_get_note(self, client, mock_session):
        mock_note = self._make_mock_note()
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_note)
        resp = client.get(f"/api/v1/notes/{mock_note.id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["id"] == mock_note.id

    def test_get_note_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get(f"/api/v1/notes/{uuid.uuid4()}")
        assert resp.status_code == 404

    def test_update_note(self, client, mock_session):
        mock_note = self._make_mock_note(title="旧标题")
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_note)
        resp = client.put(f"/api/v1/notes/{mock_note.id}", json={
            "title": "新标题",
        })
        assert resp.status_code == 200
        assert mock_note.title == "新标题"

    def test_soft_delete_note(self, client, mock_session):
        mock_note = self._make_mock_note(deleted_at=None)
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_note)
        resp = client.delete(f"/api/v1/notes/{mock_note.id}")
        assert resp.status_code == 200
        assert mock_note.deleted_at is not None

    def test_submit_review(self, client, mock_session, mock_knowledge_client):
        mock_note = self._make_mock_note(audit_status="draft")
        mock_knowledge_client.submit_review = AsyncMock(return_value={
            "review_id": str(uuid.uuid4()),
            "status": "approved",
            "risk_score": 0,
            "risk_labels": [],
            "review_detail": {"ai_reasoning": "内容正常"},
        })
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_note)
        resp = client.post(f"/api/v1/notes/{mock_note.id}/submit-review")
        assert resp.status_code == 200
        assert mock_note.audit_status == "approved"

    def test_withdraw_review(self, client, mock_session):
        mock_note = self._make_mock_note(audit_status="submitted", submitted_at="2026-05-20T10:00:00Z")
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_note)
        resp = client.post(f"/api/v1/notes/{mock_note.id}/withdraw-review")
        assert resp.status_code == 200
        assert resp.json()["data"]["audit_status"] == "draft"

    def test_share_card(self, client, mock_session):
        mock_note = self._make_mock_note(
            title="A" * 25,
            content="B" * 60,
        )
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_note)
        resp = client.get(f"/api/v1/notes/{mock_note.id}/share-card")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["title"] == "A" * 20
        assert data["content"] == "B" * 50
        assert data["tags"] == ["编程", "Python"]

    def test_audit_status(self, client, mock_session):
        mock_note = self._make_mock_note(audit_status="approved", submitted_at="2026-05-20T10:00:00Z")
        mock_session.execute.side_effect = [
            _mock_result(scalar=1),
            _mock_result(scalars_all=[mock_note]),
        ]
        resp = client.get("/api/v1/notes/audit-status")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == 1
        assert body["data"][0]["audit_status"] == "approved"


class TestPointsRoutes:

    def _make_mock_record(self, **overrides):
        r = MagicMock(spec=PointsRecord)
        r.id = str(uuid.uuid4())
        r.user_id = "anonymous"
        r.points = 10
        r.balance_after = 10
        r.action_type = "ad_watch"
        r.reference_id = None
        r.description = "测试记录"
        r.created_at = "2026-05-21 10:00:00+00"
        for k, v in overrides.items():
            setattr(r, k, v)
        return r

    def _make_mock_config(self, **overrides):
        c = MagicMock(spec=Config)
        c.config_key = "points_rules"
        c.config_value = {
            "learn_card": 1,
            "daily_challenge": 15,
            "create_note": 5,
            "ad_watch": 10,
            "daily_ad_limit": 100,
        }
        c.version = 1
        c.description = "积分规则"
        c.updated_by = "admin"
        c.updated_at = "2026-05-21 10:00:00+00"
        for k, v in overrides.items():
            setattr(c, k, v)
        return c

    def test_get_balance(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar=50)
        resp = client.get("/api/v1/points/balance")
        assert resp.status_code == 200
        assert resp.json()["data"]["balance"] == 50

    def test_get_records(self, client, mock_session):
        mock_record = self._make_mock_record()
        mock_session.execute.side_effect = [
            _mock_result(scalar=1),                     # COUNT
            _mock_result(scalars_all=[mock_record]),     # SELECT
        ]
        resp = client.get("/api/v1/points/records")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == 1
        assert body["meta"]["total"] == 1
        assert body["data"][0]["action_type"] == "ad_watch"

    def test_get_records_with_action_type_filter(self, client, mock_session):
        mock_record = self._make_mock_record(action_type="learn_card", points=1)
        mock_session.execute.side_effect = [
            _mock_result(scalar=1),
            _mock_result(scalars_all=[mock_record]),
        ]
        resp = client.get("/api/v1/points/records?action_type=learn_card")
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"][0]["action_type"] == "learn_card"

    def test_get_rules(self, client, mock_session):
        config = self._make_mock_config()
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.get("/api/v1/points/rules")
        assert resp.status_code == 200
        assert resp.json()["data"]["learn_card"] == 1
        assert resp.json()["data"]["daily_challenge"] == 15

    def test_get_rules_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/points/rules")
        assert resp.status_code == 200
        assert resp.json()["data"] == {}

    def test_ad_watch(self, client, mock_session):
        # First call: balance SUM = 0
        mock_session.execute.return_value = _mock_result(scalar=0)
        resp = client.post("/api/v1/points/ad-watch")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["points_added"] == 10
        assert data["balance_after"] == 10
        assert data["daily_total"] == 1
        assert data["daily_limit"] == 100

    def test_ad_watch_daily_limit_reached(self, client, mock_session, mock_redis):
        mock_redis.get.return_value = "100"
        resp = client.post("/api/v1/points/ad-watch")
        assert resp.status_code == 400
        assert resp.json()["code"] == "DAILY_LIMIT_REACHED"
