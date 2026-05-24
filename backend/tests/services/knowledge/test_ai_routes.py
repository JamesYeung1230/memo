"""
AI generation route unit tests - Mock provider + Mock DB.
Covers 4 endpoints x success/error paths.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from services.knowledge.routes.ai_generation import router as ai_generation_router
from services.knowledge.routes.domain import router as domain_router
from services.knowledge.routes.chapter import router as chapter_router
from services.knowledge.routes.card import router as card_router
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
def mock_card():
    c = MagicMock()
    c.id = str(uuid.uuid4())
    c.title = "test-card"
    c.core_concept = "core-concept"
    c.detail = "<p>detail</p>"
    c.life_analogy = "analogy"
    c.tags = ["test"]
    c.difficulty = "beginner"
    c.is_premium = False
    c.unlock_points = None
    c.status = "published"
    return c


@pytest.fixture
def client(mock_session):
    app = FastAPI()
    app.include_router(ai_generation_router)
    app.include_router(domain_router)
    app.include_router(chapter_router)
    app.include_router(card_router)

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


class TestAIGenerateCards:

    def test_generate_cards_sync(self, client, mock_session):
        """Sync mode: returns generated cards directly"""
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),  # chapter exists
            _mock_result(scalar_one_or_none=None, scalar=1),  # noop
        ]
        resp = client.post("/api/v1/ai/generate-cards", json={
            "topics": ["variable", "function"],
            "chapter_id": str(uuid.uuid4()),
            "mode": "sync",
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "results" in data
        assert "failed_topics" in data

    def test_generate_cards_sync_chapter_not_found(self, client, mock_session):
        """Chapter does not exist"""
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/ai/generate-cards", json={
            "topics": ["variable"],
            "chapter_id": str(uuid.uuid4()),
            "mode": "sync",
        })
        assert resp.status_code == 404

    def test_generate_cards_async(self, client, mock_session):
        """Async mode: returns task_id"""
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=MagicMock()),  # chapter exists
        ]
        resp = client.post("/api/v1/ai/generate-cards", json={
            "topics": ["variable"],
            "chapter_id": str(uuid.uuid4()),
            "mode": "async",
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["status"] == "processing"
        assert "task_id" in data

    def test_generate_cards_invalid_mode(self, client, mock_session):
        """Invalid mode should fail validation"""
        resp = client.post("/api/v1/ai/generate-cards", json={
            "topics": ["variable"],
            "chapter_id": str(uuid.uuid4()),
            "mode": "invalid",
        })
        assert resp.status_code == 422

    def test_generate_cards_empty_topics(self, client, mock_session):
        """Empty topics should fail validation"""
        resp = client.post("/api/v1/ai/generate-cards", json={
            "topics": [],
            "chapter_id": str(uuid.uuid4()),
            "mode": "sync",
        })
        assert resp.status_code == 422

    def test_generate_cards_too_many_topics(self, client, mock_session):
        """More than 10 topics should fail"""
        resp = client.post("/api/v1/ai/generate-cards", json={
            "topics": [f"t{i}" for i in range(11)],
            "chapter_id": str(uuid.uuid4()),
            "mode": "sync",
        })
        assert resp.status_code == 422


class TestAIGetResult:

    def test_get_result_processing(self, client, mock_session):
        """Task still processing"""
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=None),  # not completed/failed
            _mock_result(scalar_one_or_none=MagicMock()),  # is processing
        ]
        resp = client.get(f"/api/v1/ai/generate-cards/{uuid.uuid4()}/result")
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "processing"

    def test_get_result_completed(self, client, mock_session):
        """Task completed with results"""
        mock_history = MagicMock()
        mock_history.task_status = "completed"
        mock_history.generated_content = {"title": "test"}
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_history)
        resp = client.get(f"/api/v1/ai/generate-cards/{uuid.uuid4()}/result")
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "completed"

    def test_get_result_not_found(self, client, mock_session):
        """No history for this task_id"""
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=None),  # not completed/failed
            _mock_result(scalar_one_or_none=None),  # not processing either
        ]
        resp = client.get(f"/api/v1/ai/generate-cards/{uuid.uuid4()}/result")
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "failed"


class TestAIGenerateQuestion:

    def test_generate_question(self, client, mock_session, mock_card):
        """Generate question for existing card"""
        mock_session.execute.side_effect = [
            _mock_result(scalar_one_or_none=mock_card),  # card exists
        ]
        resp = client.post(f"/api/v1/ai/generate-questions/{mock_card.id}", json={
            "mode": "sync",
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "question_text" in data
        assert "options" in data
        assert "correct_option" in data

    def test_generate_question_card_not_found(self, client, mock_session):
        """Card does not exist"""
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.post("/api/v1/ai/generate-questions/00000000-0000-0000-0000-000000000000", json={
            "mode": "sync",
        })
        assert resp.status_code == 404
