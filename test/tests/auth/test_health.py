"""
Auth service integration test - /health endpoint.

Tests that the Auth service's health endpoint returns 200 OK.
"""

import pytest
from tests.utils.client import ApiClient


class TestHealth:
    def test_health_endpoint(self, anonymous_client: ApiClient):
        resp = anonymous_client.get("/health")
        assert resp.status_code == 200
        assert resp.body.get("status") == "ok"
