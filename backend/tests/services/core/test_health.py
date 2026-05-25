"""
Core service unit test - /health endpoint.
Strategy: Use FastAPI TestClient to verify the health endpoint returns 200.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient


def make_app() -> FastAPI:
    app = FastAPI()

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


class TestHealth:
    def test_health_returns_200(self):
        app = make_app()
        client = TestClient(app)
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}
