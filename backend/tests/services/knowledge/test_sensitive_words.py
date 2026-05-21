"""
Sensitive words route unit tests - Mock DB.
Covers 7 endpoints x success/error paths.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from services.knowledge.routes.sensitive_words import router
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
def mock_word():
    w = MagicMock()
    w.id = str(uuid.uuid4())
    w.word = "badword"
    w.match_mode = "exact"
    w.enabled = True
    w.created_at = None
    w.updated_at = None
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


class TestSensitiveWordsRoutes:

    def test_list_words(self, client, mock_session, mock_word):
        mock_session.execute.return_value = _mock_result(scalar=1, scalars_all=[mock_word])
        resp = client.get("/api/v1/sensitive-words?page=1&page_size=20")
        assert resp.status_code == 200
        assert resp.json()["meta"]["total"] == 1

    def test_list_words_with_filters(self, client, mock_session, mock_word):
        mock_session.execute.return_value = _mock_result(scalar=1, scalars_all=[mock_word])
        resp = client.get("/api/v1/sensitive-words?page=1&page_size=20&keyword=bad&match_mode=exact")
        assert resp.status_code == 200

    def test_get_word(self, client, mock_session, mock_word):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_word)
        resp = client.get(f"/api/v1/sensitive-words/{mock_word.id}")
        assert resp.status_code == 200

    def test_get_word_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.get("/api/v1/sensitive-words/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_create_word(self, client, mock_session, mock_word):
        mock_session.refresh = AsyncMock(side_effect=lambda x: setattr(x, 'id', mock_word.id))
        resp = client.post("/api/v1/sensitive-words", json={
            "word": "badword",
            "match_mode": "exact",
            "enabled": True,
        })
        assert resp.status_code == 201

    def test_create_word_validation(self, client, mock_session):
        resp = client.post("/api/v1/sensitive-words", json={"word": "", "match_mode": "exact"})
        assert resp.status_code == 422

    def test_update_word(self, client, mock_session, mock_word):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_word)
        resp = client.put(f"/api/v1/sensitive-words/{mock_word.id}", json={"word": "newword"})
        assert resp.status_code == 200

    def test_update_word_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/sensitive-words/00000000-0000-0000-0000-000000000000", json={"word": "x"})
        assert resp.status_code == 404

    def test_delete_word(self, client, mock_session, mock_word):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_word)
        resp = client.delete(f"/api/v1/sensitive-words/{mock_word.id}")
        assert resp.status_code == 204

    def test_delete_word_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.delete("/api/v1/sensitive-words/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_batch_delete(self, client, mock_session):
        mock_session.execute.return_value = _mock_result()
        resp = client.post("/api/v1/sensitive-words/batch-delete", json={
            "ids": ["id1", "id2"],
        })
        assert resp.status_code == 200

    def test_toggle_word(self, client, mock_session, mock_word):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_word)
        resp = client.put(f"/api/v1/sensitive-words/{mock_word.id}/toggle", json={"enabled": False})
        assert resp.status_code == 200
        assert resp.json()["data"]["enabled"] is False

    def test_toggle_word_not_found(self, client, mock_session):
        mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
        resp = client.put("/api/v1/sensitive-words/00000000-0000-0000-0000-000000000000/toggle", json={"enabled": True})
        assert resp.status_code == 404

    @patch("services.knowledge.routes.sensitive_words.redis.Redis.from_url")
    def test_reload_cache(self, mock_redis, client, mock_session, mock_word):
        mock_redis_instance = MagicMock()
        mock_redis_instance.set = AsyncMock()
        mock_redis_instance.close = AsyncMock()
        mock_redis.return_value = mock_redis_instance
        mock_session.execute.return_value = _mock_result(scalars_all=[mock_word])

        resp = client.post("/api/v1/sensitive-words/reload")
        assert resp.status_code == 200
        assert resp.json()["data"]["word_count"] == 1
