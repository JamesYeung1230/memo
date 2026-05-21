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
from services.core.routes.quiz import router as quiz_router
from services.core.clients import KnowledgeClient
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
def client(mock_session, mock_knowledge_client):
    app = FastAPI()
    app.include_router(learning_router)
    app.include_router(quiz_router)

    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    app.state.db_session_factory = MagicMock(return_value=mock_session)
    app.state.knowledge_client = mock_knowledge_client

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
