"""
Knowledge service route unit tests - Mock DB full coverage.
Strategy: Use FastAPI TestClient + Mock AsyncSession to verify all route paths.
Covers 4 route files x 25 endpoints (success + error paths)."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from services.knowledge.routes import (
    domain_router,
    chapter_router,
    card_router,
    question_router,
)
from shared.errors import AppException


# ============================================================
# Helper: Build Mock Session
# TestClient runs async handler as:
#   session_factory() -> async with -> __aenter__ -> session
#   await session.execute() -> result (MagicMock)
#   result.scalar_one_or_none() -> synchronous return value# ============================================================

def _mock_result(**kwargs):
    """Create synchronous return object for execute()"""
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


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def mock_session():
    """AsyncMock session: execute return value is MagicMock (sync method)"""
    session = AsyncMock()
    session.add = MagicMock()
    session.delete = AsyncMock()
    session.commit = AsyncMock(return_value=None)
    session.refresh = AsyncMock(return_value=None)
    session.execute = AsyncMock(return_value=_mock_result())
    return session


@pytest.fixture
def client(mock_session):
    """Use TestClient for sync calls (wraps async handler)"""
    app = FastAPI()
    app.include_router(domain_router)
    app.include_router(chapter_router)
    app.include_router(card_router)
    app.include_router(question_router)
    # async with factory() as session -> mock_session.__aenter__ -> mock_session
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    app.state.db_session_factory = MagicMock(return_value=mock_session)

    # Register exception handlers (mirroring main.py)
    @app.exception_handler(AppException)
    async def app_exc_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.http_status,
            content={**exc.to_dict(), "request_id": ""},
        )

    @app.exception_handler(RequestValidationError)
    async def val_exc_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "data": None,
                "detail": {"errors": [{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in exc.errors()]},
                "request_id": "",
            },
        )

    return TestClient(app)


@pytest.fixture
def mock_domain():
    d = MagicMock()
    d.id = str(uuid.uuid4())
    d.name = "test-domain"
    d.icon = "test"
    d.sort_order = 1
    d.is_free = True
    d.unlock_points = None
    d.status = "published"
    d.created_at = None
    d.updated_at = None
    return d


@pytest.fixture
def mock_chapter():
    c = MagicMock()
    c.id = str(uuid.uuid4())
    c.domain_id = str(uuid.uuid4())
    c.name = "test-chapter"
    c.sort_order = 1
    c.status = "published"
    c.created_at = None
    c.updated_at = None
    return c


@pytest.fixture
def mock_card():
    c = MagicMock()
    c.id = str(uuid.uuid4())
    c.chapter_id = str(uuid.uuid4())
    c.title = "test-card"
    c.core_concept = "core-concept"
    c.detail = "<p>detail</p>"
    c.life_analogy = "analogy"
    c.tags = ["test"]
    c.difficulty = "beginner"
    c.is_premium = False
    c.unlock_points = None
    c.status = "published"
    c.deleted_at = None
    c.created_at = None
    c.updated_at = None
    return c


@pytest.fixture
def mock_question():
    q = MagicMock()
    q.id = str(uuid.uuid4())
    q.card_id = str(uuid.uuid4())
    q.question_text = "test-question?"
    q.options = {"A": "A", "B": "B", "C": "C", "D": "D"}
    q.correct_option = "A"
    q.explanation = "explanation"
    q.created_at = None
    q.updated_at = None
    return q


# ============================================================
# Test: Domain Routes (15 paths)
# ============================================================

class TestDomainRoutes:

    def test_list_domains(self, client, mock_session, mock_domain):
        mock_session.execute.return_value = _mock_result(scalar=1, scalars_all=[mock_domain])
        resp = client.get("/api/v1/domains?page=1&page_size=20")
        assert resp.status_code == 200
        assert resp.json()["code"] == 0
        assert resp.json()["meta"]["total"] == 1

    def test_list_domains_with_status(self, client, mock_session, mock_domain):
        mock_session.execute.return_value = _mock_result(scalar=1, scalars_all=[mock_domain])
        resp = client.get("/api/v1/domains?page=1&page_size=20&status=published")
        assert resp.status_code == 200

    def test_list_domains_empty(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar=0, scalars_all=[])
        resp = client.get("/api/v1/domains?page=1&page_size=20")
        assert resp.json()["data"] == []

    def test_get_domain(self, client, mock_session, mock_domain):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_domain)
        resp = client.get(f"/api/v1/domains/{mock_domain.id}")
        assert resp.status_code == 200

    def test_get_domain_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/domains/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_create_domain_success(self, client, mock_session, mock_domain):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=None),
            _mock_result(scalar=5),
        ]
        mock_session.refresh = AsyncMock(side_effect=lambda x: setattr(x, 'id', mock_domain.id))
        resp = client.post("/api/v1/domains", json={"name": "new-domain", "icon": "new"})
        assert resp.status_code == 201

    def test_create_domain_duplicate(self, client, mock_session, mock_domain):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_domain)
        resp = client.post("/api/v1/domains", json={"name": "duplicate", "icon": "x"})
        assert resp.status_code == 409

    def test_create_domain_validation(self, client, mock_session):
        resp = client.post("/api/v1/domains", json={"name": "", "icon": "x"})
        assert resp.status_code == 422

    def test_update_domain(self, client, mock_session, mock_domain):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=mock_domain),
            _mock_result(scalar_one_or_none=None),
        ]
        resp = client.put(f"/api/v1/domains/{mock_domain.id}", json={"name": "new-name"})
        assert resp.status_code == 200

    def test_update_domain_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/domains/00000000-0000-0000-0000-000000000000", json={"name": "x"})
        assert resp.status_code == 404

    def test_update_domain_duplicate(self, client, mock_session, mock_domain):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=mock_domain),
            _mock_result(scalar_one_or_none=MagicMock()),
        ]
        resp = client.put(f"/api/v1/domains/{mock_domain.id}", json={"name": "duplicate"})
        assert resp.status_code == 409

    def test_delete_domain(self, client, mock_session, mock_domain):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_domain)
        resp = client.delete(f"/api/v1/domains/{mock_domain.id}")
        assert resp.status_code == 204

    def test_delete_domain_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.delete("/api/v1/domains/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_reorder_domains(self, client, mock_session):
        mock_session.execute.return_value = _mock_result()
        resp = client.put("/api/v1/domains/reorder", json={"order": ["id1", "id2"]})
        assert resp.status_code == 200

    def test_toggle_domain_status_published_to_draft(self, client, mock_session, mock_domain):
        mock_domain.status = "published"
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_domain)
        resp = client.put(f"/api/v1/domains/{mock_domain.id}/toggle-status")
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "draft"

    def test_toggle_domain_status_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/domains/00000000-0000-0000-0000-000000000000/toggle-status")
        assert resp.status_code == 404


# ============================================================
# Test: Chapter Routes (14 paths)
# ============================================================

class TestChapterRoutes:

    def test_list_chapters(self, client, mock_session, mock_chapter):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),
            _mock_result(scalars_all=[mock_chapter]),
        ]
        resp = client.get(f"/api/v1/domains/{mock_chapter.domain_id}/chapters")
        assert resp.status_code == 200

    def test_list_chapters_domain_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/domains/00000000-0000-0000-0000-000000000000/chapters")
        assert resp.status_code == 404

    def test_list_chapters_filtered(self, client, mock_session, mock_chapter):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),
            _mock_result(scalars_all=[mock_chapter]),
        ]
        resp = client.get(f"/api/v1/domains/{mock_chapter.domain_id}/chapters?status=published")
        assert resp.status_code == 200

    def test_get_chapter(self, client, mock_session, mock_chapter):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_chapter)
        resp = client.get(f"/api/v1/chapters/{mock_chapter.id}")
        assert resp.status_code == 200

    def test_get_chapter_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/chapters/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_create_chapter(self, client, mock_session, mock_chapter):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),
            _mock_result(scalar_one_or_none=None),
            _mock_result(scalar=3),
        ]
        mock_session.refresh = AsyncMock(side_effect=lambda x: setattr(x, 'id', mock_chapter.id))
        resp = client.post("/api/v1/chapters", json={"domain_id": mock_chapter.domain_id, "name": "new-chapter"})
        assert resp.status_code == 201

    def test_create_chapter_domain_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/chapters", json={"domain_id": str(uuid.uuid4()), "name": "x"})
        assert resp.status_code == 404

    def test_create_chapter_duplicate(self, client, mock_session, mock_chapter):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),
            _mock_result(scalar_one_or_none=mock_chapter),
        ]
        resp = client.post("/api/v1/chapters", json={"domain_id": mock_chapter.domain_id, "name": "duplicate"})
        assert resp.status_code == 409

    def test_update_chapter(self, client, mock_session, mock_chapter):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=mock_chapter),
            _mock_result(scalar_one_or_none=None),
        ]
        resp = client.put(f"/api/v1/chapters/{mock_chapter.id}", json={"name": "new-name"})
        assert resp.status_code == 200

    def test_update_chapter_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/chapters/00000000-0000-0000-0000-000000000000", json={"name": "x"})
        assert resp.status_code == 404

    def test_update_chapter_duplicate(self, client, mock_session, mock_chapter):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=mock_chapter),
            _mock_result(scalar_one_or_none=MagicMock()),
        ]
        resp = client.put(f"/api/v1/chapters/{mock_chapter.id}", json={"name": "duplicate"})
        assert resp.status_code == 409

    def test_delete_chapter(self, client, mock_session, mock_chapter):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_chapter)
        resp = client.delete(f"/api/v1/chapters/{mock_chapter.id}")
        assert resp.status_code == 204

    def test_delete_chapter_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.delete("/api/v1/chapters/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_reorder_chapters(self, client, mock_session):
        mock_session.execute.return_value = _mock_result()
        resp = client.put("/api/v1/chapters/reorder", json={"order": ["id1"]})
        assert resp.status_code == 200


# ============================================================
# Test: Card Routes (12 paths)
# ============================================================

class TestCardRoutes:

    def test_list_cards(self, client, mock_session, mock_card):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),  # chapter exists
            _mock_result(scalar=1, scalars_all=[mock_card]),  # count
            _mock_result(scalar=1, scalars_all=[mock_card]),  # select
        ]
        resp = client.get(f"/api/v1/chapters/{mock_card.chapter_id}/cards?status=all")
        assert resp.status_code == 200

    def test_list_cards_chapter_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/chapters/00000000-0000-0000-0000-000000000000/cards")
        assert resp.status_code == 404

    def test_list_cards_with_keyword(self, client, mock_session, mock_card):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),  # chapter exists
            _mock_result(scalar=1, scalars_all=[mock_card]),  # count
            _mock_result(scalar=1, scalars_all=[mock_card]),  # select
        ]
        resp = client.get(f"/api/v1/chapters/{mock_card.chapter_id}/cards?status=all&keyword=test")
        assert resp.status_code == 200

    def test_list_cards_with_status_filter(self, client, mock_session, mock_card):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),  # chapter exists
            _mock_result(scalar=1, scalars_all=[mock_card]),  # count
            _mock_result(scalar=1, scalars_all=[mock_card]),  # select
        ]
        resp = client.get(f"/api/v1/chapters/{mock_card.chapter_id}/cards?status=published")
        assert resp.status_code == 200

    def test_get_card(self, client, mock_session, mock_card):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_card)
        resp = client.get(f"/api/v1/cards/{mock_card.id}")
        assert resp.status_code == 200

    def test_get_card_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/cards/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_create_card(self, client, mock_session, mock_card):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=MagicMock())
        mock_session.refresh = AsyncMock(side_effect=lambda x: setattr(x, 'id', mock_card.id))
        resp = client.post("/api/v1/cards", json={
            "chapter_id": mock_card.chapter_id, "title": "new-card",
            "core_concept": "concept", "detail": "content", "life_analogy": "analogy",
        })
        assert resp.status_code == 201

    def test_create_card_chapter_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/cards", json={
            "chapter_id": str(uuid.uuid4()), "title": "x",
            "core_concept": "x", "detail": "x", "life_analogy": "x",
        })
        assert resp.status_code == 404

    def test_update_card(self, client, mock_session, mock_card):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_card)
        resp = client.put(f"/api/v1/cards/{mock_card.id}", json={"title": "new-title"})
        assert resp.status_code == 200

    def test_update_card_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/cards/00000000-0000-0000-0000-000000000000", json={"title": "x"})
        assert resp.status_code == 404

    def test_delete_card_soft(self, client, mock_session, mock_card):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_card)
        resp = client.delete(f"/api/v1/cards/{mock_card.id}")
        assert resp.status_code == 204

    def test_delete_card_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.delete("/api/v1/cards/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_toggle_card_status(self, client, mock_session, mock_card):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_card)
        resp = client.put(f"/api/v1/cards/{mock_card.id}/toggle-status", json={"status": "draft"})
        assert resp.status_code == 200

    def test_toggle_card_status_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/cards/00000000-0000-0000-0000-000000000000/toggle-status", json={"status": "draft"})
        assert resp.status_code == 404


# ============================================================
# Test: Question Routes (14 paths)
# ============================================================

class TestQuestionRoutes:

    def test_get_question_by_card(self, client, mock_session, mock_question):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_question)
        resp = client.get(f"/api/v1/cards/{mock_question.card_id}/question")
        assert resp.status_code == 200

    def test_get_question_by_card_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/cards/00000000-0000-0000-0000-000000000000/question")
        assert resp.status_code == 404

    def test_get_question(self, client, mock_session, mock_question):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_question)
        resp = client.get(f"/api/v1/questions/{mock_question.id}")
        assert resp.status_code == 200

    def test_get_question_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/questions/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_create_question(self, client, mock_session, mock_question, mock_card):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=mock_card),
            _mock_result(scalar_one_or_none=None),
        ]
        mock_session.refresh = AsyncMock(side_effect=lambda x: setattr(x, 'id', mock_question.id))
        resp = client.post("/api/v1/questions", json={
            "card_id": mock_question.card_id, "question_text": "test?",
            "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
            "correct_option": "A", "explanation": "explanation",
        })
        assert resp.status_code == 201

    def test_create_question_card_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/questions", json={
            "card_id": str(uuid.uuid4()), "question_text": "?",
            "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
            "correct_option": "A", "explanation": "x",
        })
        assert resp.status_code == 404

    def test_create_question_already_exists(self, client, mock_session, mock_card, mock_question):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=mock_card),
            _mock_result(scalar_one_or_none=mock_question),
        ]
        resp = client.post("/api/v1/questions", json={
            "card_id": str(uuid.uuid4()), "question_text": "?",
            "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
            "correct_option": "A", "explanation": "x",
        })
        assert resp.status_code == 409

    def test_create_question_invalid_option(self, client, mock_session, mock_card):
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=mock_card),
            _mock_result(scalar_one_or_none=None),
        ]
        resp = client.post("/api/v1/questions", json={
            "card_id": str(uuid.uuid4()), "question_text": "?",
            "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
            "correct_option": "X", "explanation": "x",
        })
        assert resp.status_code == 422

    def test_update_question(self, client, mock_session, mock_question):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_question)
        resp = client.put(f"/api/v1/questions/{mock_question.id}", json={"question_text": "new-question"})
        assert resp.status_code == 200

    def test_update_question_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/questions/00000000-0000-0000-0000-000000000000", json={"question_text": "x"})
        assert resp.status_code == 404

    def test_update_question_invalid_option(self, client, mock_session, mock_question):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_question)
        resp = client.put(f"/api/v1/questions/{mock_question.id}", json={
            "correct_option": "X", "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
        })
        assert resp.status_code == 422

    def test_delete_question(self, client, mock_session, mock_question):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_question)
        resp = client.delete(f"/api/v1/questions/{mock_question.id}")
        assert resp.status_code == 204

    def test_delete_question_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.delete("/api/v1/questions/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404


