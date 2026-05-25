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
from services.core.routes.operations import router as operations_router
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
    app.include_router(operations_router)

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


class TestOperationsRoutes:
    """C6 运营配置 API 路由单元测试."""

    def _make_mock_banner(self, **overrides) -> MagicMock:
        b = MagicMock()
        b.id = str(uuid.uuid4())
        b.title = "测试 Banner"
        b.image_url = "http://example.com/banner.jpg"
        b.link_type = "mini_program"
        b.link_param = "pages/index/index"
        b.sort_order = 1
        b.status = "enabled"
        b.start_date = None
        b.end_date = None
        b.click_count = 0
        b.impression_pv = 0
        b.impression_uv = 0
        b.created_at = "2026-05-21 10:00:00+00"
        b.updated_at = "2026-05-21 10:00:00+00"
        for k, v in overrides.items():
            setattr(b, k, v)
        return b

    def _make_mock_badge(self, **overrides) -> MagicMock:
        a = MagicMock()
        a.id = str(uuid.uuid4())
        a.name = "初出茅庐"
        a.description = "完成第一张卡片学习"
        a.icon_url = "http://example.com/badge.png"
        a.points_required = 10
        a.status = "published"
        a.created_at = "2026-05-21 10:00:00+00"
        a.updated_at = "2026-05-21 10:00:00+00"
        for k, v in overrides.items():
            setattr(a, k, v)
        return a

    def _make_mock_config(self, config_key: str, **overrides) -> MagicMock:
        c = MagicMock()
        c.config_key = config_key
        c.config_value = {}
        c.version = 1
        c.description = None
        c.updated_by = "admin"
        c.updated_at = "2026-05-21 10:00:00+00"
        for k, v in overrides.items():
            setattr(c, k, v)
        return c

    # ── Banner ──────────────────────────────────────

    def test_list_banners(self, client, mock_session):
        mock_banner = self._make_mock_banner()
        mock_session.execute.return_value = _mock_result(scalars_all=[mock_banner])
        resp = client.get("/api/v1/admin/banners")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["title"] == "测试 Banner"
        assert data[0]["status"] == "enabled"

    def test_create_banner(self, client, mock_session):
        resp = client.post("/api/v1/admin/banners", json={
            "title": "新 Banner",
            "image_url": "http://example.com/new.jpg",
            "sort_order": 2,
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["title"] == "新 Banner"

    def test_update_banner(self, client, mock_session):
        mock_banner = self._make_mock_banner(title="旧标题")
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_banner)
        resp = client.put(f"/api/v1/admin/banners/{mock_banner.id}", json={
            "title": "新标题",
        })
        assert resp.status_code == 200
        assert mock_banner.title == "新标题"

    def test_delete_banner(self, client, mock_session):
        mock_banner = self._make_mock_banner()
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_banner)
        resp = client.delete(f"/api/v1/admin/banners/{mock_banner.id}")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["deleted"] is True

    def test_delete_banner_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.delete(f"/api/v1/admin/banners/{uuid.uuid4()}")
        assert resp.status_code == 404

    def test_toggle_banner_enabled_to_disabled(self, client, mock_session):
        mock_banner = self._make_mock_banner(status="enabled")
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_banner)
        resp = client.post(f"/api/v1/admin/banners/{mock_banner.id}/toggle")
        assert resp.status_code == 200
        assert mock_banner.status == "disabled"

    def test_toggle_banner_disabled_to_enabled(self, client, mock_session):
        mock_banner = self._make_mock_banner(status="disabled")
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_banner)
        resp = client.post(f"/api/v1/admin/banners/{mock_banner.id}/toggle")
        assert resp.status_code == 200
        assert mock_banner.status == "enabled"

    def test_reorder_banners(self, client, mock_session):
        banner_a = self._make_mock_banner(sort_order=1)
        banner_b = self._make_mock_banner(sort_order=2)
        mock_session.execute.side_effect = [
            _mock_result(scalars_all=[banner_a, banner_b]),   # WHERE IN
            _mock_result(scalars_all=[banner_a, banner_b]),   # final list
        ]
        resp = client.put("/api/v1/admin/banners/reorder", json={
            "items": [
                {"id": banner_a.id, "sort_order": 2},
                {"id": banner_b.id, "sort_order": 1},
            ],
        })
        assert resp.status_code == 200
        assert resp.json()["code"] == 0

    def test_upload_banner_image(self, client, mock_session):
        mock_banner = self._make_mock_banner()
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_banner)
        resp = client.post(f"/api/v1/admin/banners/{mock_banner.id}/upload")
        assert resp.status_code == 200
        assert resp.json()["data"]["success"] is True

    # ── Config (unlock / theme / ad) ─────────────────

    def test_get_unlock_config_found(self, client, mock_session):
        config = self._make_mock_config(config_key="unlock_config", config_value={"domain": 50, "card": 5})
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.get("/api/v1/admin/unlock-config")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["config_key"] == "unlock_config"
        assert data["config_value"]["domain"] == 50

    def test_get_unlock_config_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/admin/unlock-config")
        assert resp.status_code == 200
        assert resp.json()["data"] == {}

    def test_update_unlock_config(self, client, mock_session):
        config = self._make_mock_config(
            config_key="unlock_config",
            config_value={"domain": 50, "card": 5},
            version=1,
        )
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.put("/api/v1/admin/unlock-config", json={
            "config_value": {"domain": 100, "card": 10},
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["config_value"]["domain"] == 100
        assert data["version"] == 2

    def test_get_theme_config(self, client, mock_session):
        config = self._make_mock_config(
            config_key="theme_config",
            config_value={"primary_color": "#1890ff", "bg_color": "#ffffff"},
        )
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.get("/api/v1/admin/theme-config")
        assert resp.status_code == 200
        assert resp.json()["data"]["config_value"]["primary_color"] == "#1890ff"

    def test_update_ad_config(self, client, mock_session):
        config = self._make_mock_config(
            config_key="ad_config",
            config_value={"interval": 60, "max_per_day": 10},
            version=1,
        )
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.put("/api/v1/admin/ad-config", json={
            "config_value": {"interval": 120, "max_per_day": 5},
            "description": "更新广告配置",
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["config_value"]["interval"] == 120
        assert data["version"] == 2
        assert config.description == "更新广告配置"

    # ── Badge ────────────────────────────────────────

    def test_list_badges(self, client, mock_session):
        mock_badge = self._make_mock_badge()
        mock_session.execute.return_value = _mock_result(scalars_all=[mock_badge])
        resp = client.get("/api/v1/admin/badges")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["name"] == "初出茅庐"

    def test_create_badge(self, client, mock_session):
        resp = client.post("/api/v1/admin/badges", json={
            "name": "学霸",
            "description": "累计获得100积分",
            "icon_url": "http://example.com/scholar.png",
            "points_required": 100,
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["name"] == "学霸"
        assert data["points_required"] == 100

    def test_toggle_badge_published_to_draft(self, client, mock_session):
        mock_badge = self._make_mock_badge(status="published")
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_badge)
        resp = client.post(f"/api/v1/admin/badges/{mock_badge.id}/toggle")
        assert resp.status_code == 200
        assert mock_badge.status == "draft"

    def test_toggle_badge_draft_to_published(self, client, mock_session):
        mock_badge = self._make_mock_badge(status="draft")
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_badge)
        resp = client.post(f"/api/v1/admin/badges/{mock_badge.id}/toggle")
        assert resp.status_code == 200
        assert mock_badge.status == "published"

    def test_update_badge(self, client, mock_session):
        mock_badge = self._make_mock_badge(name="旧名称")
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_badge)
        resp = client.put(f"/api/v1/admin/badges/{mock_badge.id}", json={
            "name": "新名称",
            "points_required": 200,
        })
        assert resp.status_code == 200
        assert mock_badge.name == "新名称"
        assert mock_badge.points_required == 200

    def test_update_badge_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put(f"/api/v1/admin/badges/{uuid.uuid4()}", json={"name": "不存在"})
        assert resp.status_code == 404

    # ── Homepage Config ──────────────────────────────

    def test_get_homepage_config(self, client, mock_session):
        config = self._make_mock_config(
            config_key="homepage_module_order",
            config_value={"modules": ["banner", "progress", "domains"]},
        )
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=config)
        resp = client.get("/api/v1/admin/homepage-config")
        assert resp.status_code == 200
        assert resp.json()["data"]["config_value"]["modules"] == ["banner", "progress", "domains"]

    def test_update_homepage_config_create_new(self, client, mock_session):
        # Config does not exist → create
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/admin/homepage-config", json={
            "config_value": {"modules": ["banner", "domains"]},
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["config_key"] == "homepage_module_order"
        assert data["config_value"]["modules"] == ["banner", "domains"]

    # ── C7 Dashboard ─────────────────────────────────

    def test_dashboard_overview(self, client, mock_session):
        """dashboard/overview 应返回核心指标."""
        mock_session.execute.side_effect = [
            _mock_result(scalar=10),    # DISTINCT users from learning_record
            _mock_result(scalar=5),     # DISTINCT users from answer_record
            _mock_result(scalar=3),     # today learning
            _mock_result(scalar=7),     # today answers
        ]
        resp = client.get("/api/v1/admin/dashboard/overview")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["total_users"] == 15
        assert data["today_learning"] == 3
        assert data["today_answers"] == 7

    def test_dashboard_review(self, client, mock_knowledge_client):
        """dashboard/review 应调用 KnowledgeClient.get_review_statistics()."""
        mock_knowledge_client.get_review_statistics = AsyncMock(return_value={
            "pending_count": 5,
            "approved_count": 20,
            "rejected_count": 2,
        })
        resp = client.get("/api/v1/admin/dashboard/review")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["pending_count"] == 5
        assert data["approved_count"] == 20

    # ── C8 Logs ──────────────────────────────────────

    def _make_mock_log(self, **overrides) -> MagicMock:
        l = MagicMock()
        l.id = str(uuid.uuid4())
        l.operator = "admin"
        l.action_type = "DELETE"
        l.target_type = "Banner"
        l.target_id = str(uuid.uuid4())
        l.detail = None
        l.ip_address = "192.168.1.1"
        l.created_at = "2026-05-21 10:00:00+00"
        for k, v in overrides.items():
            setattr(l, k, v)
        return l

    def test_list_logs(self, client, mock_session):
        """list_logs 应返回分页的操作日志列表."""
        mock_log = self._make_mock_log()
        mock_session.execute.side_effect = [
            _mock_result(scalar=1),              # COUNT
            _mock_result(scalars_all=[mock_log]),  # SELECT
        ]
        resp = client.get("/api/v1/admin/logs")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == 1
        assert body["meta"]["total"] == 1
        assert body["data"][0]["action_type"] == "DELETE"
        assert body["data"][0]["target_type"] == "Banner"

    def test_list_logs_with_filters(self, client, mock_session):
        """list_logs 支持 action_type / target_type 筛选."""
        mock_log = self._make_mock_log(action_type="CREATE", target_type="Config")
        mock_session.execute.side_effect = [
            _mock_result(scalar=1),
            _mock_result(scalars_all=[mock_log]),
        ]
        resp = client.get("/api/v1/admin/logs?action_type=CREATE&target_type=Config")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == 1
        assert body["data"][0]["action_type"] == "CREATE"

    def test_clear_logs(self, client, mock_session):
        """clear_logs 应清空所有操作日志."""
        mock_session.execute.return_value = _mock_result()
        resp = client.delete("/api/v1/admin/logs")
        assert resp.status_code == 200
        assert resp.json()["data"]["deleted"] is True
