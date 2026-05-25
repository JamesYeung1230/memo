import os
from dataclasses import dataclass
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()


@dataclass
class ApiResponse:
    status_code: int
    body: dict[str, Any]
    headers: dict[str, str]


class ApiClient:
    def __init__(self, base_url: str, token: str | None = None):
        self.base_url = base_url.rstrip("/")
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self._client = httpx.Client(base_url=self.base_url, headers=headers)

    def post(self, path: str, json: dict[str, Any] | None = None) -> ApiResponse:
        resp = self._client.post(path, json=json)
        return self._to_response(resp)

    def put(self, path: str, json: dict[str, Any] | None = None) -> ApiResponse:
        resp = self._client.put(path, json=json)
        return self._to_response(resp)

    def get(self, path: str, params: dict[str, Any] | None = None) -> ApiResponse:
        resp = self._client.get(path, params=params)
        return self._to_response(resp)

    def delete(self, path: str) -> ApiResponse:
        resp = self._client.delete(path)
        return self._to_response(resp)

    @staticmethod
    def _to_response(resp: httpx.Response) -> ApiResponse:
        try:
            body = resp.json()
        except Exception:
            body = {}
        return ApiResponse(
            status_code=resp.status_code,
            body=body,
            headers=dict(resp.headers),
        )

    def close(self) -> None:
        self._client.close()
