import httpx

from shared.errors import KnowledgeServiceException


class KnowledgeClient:
    def __init__(self, base_url: str = "http://knowledge:8002"):
        self.client = httpx.AsyncClient(base_url=base_url, timeout=30.0)

    async def close(self):
        await self.client.aclose()

    async def _handle_response(self, resp: httpx.Response):
        if resp.is_success:
            data = resp.json().get("data")
            return data
        else:
            error = resp.json().get("error", {})
            raise KnowledgeServiceException(
                code=error.get("code", "KNOWLEDGE_INTERNAL_ERROR"),
                message=error.get("message", "Knowledge service error"),
                status_code=resp.status_code,
            )

    # === Content Query ===

    async def get_domains(self, status: str = "published") -> list[dict]:
        resp = await self.client.get("/api/v1/domains", params={"status": status})
        return await self._handle_response(resp)

    async def get_chapters(self, domain_id: str, status: str = "published") -> list[dict]:
        resp = await self.client.get(f"/api/v1/domains/{domain_id}/chapters", params={"status": status})
        return await self._handle_response(resp)

    async def get_cards(self, chapter_id: str, status: str = "published") -> list[dict]:
        resp = await self.client.get(f"/api/v1/chapters/{chapter_id}/cards", params={"status": status})
        return await self._handle_response(resp)

    async def get_card_detail(self, card_id: str) -> dict:
        resp = await self.client.get(f"/api/v1/cards/{card_id}")
        return await self._handle_response(resp)

    async def get_question(self, card_id: str) -> dict:
        resp = await self.client.get(f"/api/v1/cards/{card_id}/question")
        return await self._handle_response(resp)

    # === Content Management ===

    async def create_domain(self, data: dict) -> dict:
        resp = await self.client.post("/api/v1/domains", json=data)
        return await self._handle_response(resp)

    async def update_domain(self, domain_id: str, data: dict) -> dict:
        resp = await self.client.put(f"/api/v1/domains/{domain_id}", json=data)
        return await self._handle_response(resp)

    async def delete_domain(self, domain_id: str) -> None:
        resp = await self.client.delete(f"/api/v1/domains/{domain_id}")
        resp.raise_for_status()

    async def reorder_domains(self, order: list[str]) -> dict:
        resp = await self.client.put("/api/v1/domains/reorder", json={"order": order})
        return await self._handle_response(resp)

    async def toggle_domain_status(self, domain_id: str) -> dict:
        resp = await self.client.put(f"/api/v1/domains/{domain_id}/toggle-status")
        return await self._handle_response(resp)

    # === Chapter Management ===

    async def list_chapters(self, domain_id: str) -> list[dict]:
        resp = await self.client.get(f"/api/v1/domains/{domain_id}/chapters")
        return await self._handle_response(resp)

    async def create_chapter(self, data: dict) -> dict:
        resp = await self.client.post("/api/v1/chapters", json=data)
        return await self._handle_response(resp)

    async def get_chapter_detail(self, chapter_id: str) -> dict:
        resp = await self.client.get(f"/api/v1/chapters/{chapter_id}")
        return await self._handle_response(resp)

    async def update_chapter(self, chapter_id: str, data: dict) -> dict:
        resp = await self.client.put(f"/api/v1/chapters/{chapter_id}", json=data)
        return await self._handle_response(resp)

    async def delete_chapter(self, chapter_id: str) -> None:
        resp = await self.client.delete(f"/api/v1/chapters/{chapter_id}")
        resp.raise_for_status()

    async def reorder_chapters(self, order: list[str]) -> dict:
        resp = await self.client.put("/api/v1/chapters/reorder", json={"order": order})
        return await self._handle_response(resp)

    # === Card Management ===

    async def list_cards(self, chapter_id: str, status: str = "all", keyword: str | None = None) -> list[dict]:
        params = {"status": status}
        if keyword:
            params["keyword"] = keyword
        resp = await self.client.get(f"/api/v1/chapters/{chapter_id}/cards", params=params)
        return await self._handle_response(resp)

    async def create_card(self, data: dict) -> dict:
        resp = await self.client.post("/api/v1/cards", json=data)
        return await self._handle_response(resp)

    async def update_card(self, card_id: str, data: dict) -> dict:
        resp = await self.client.put(f"/api/v1/cards/{card_id}", json=data)
        return await self._handle_response(resp)

    async def delete_card(self, card_id: str) -> None:
        resp = await self.client.delete(f"/api/v1/cards/{card_id}")
        resp.raise_for_status()

    async def toggle_card_status(self, card_id: str, status: str) -> dict:
        resp = await self.client.put(f"/api/v1/cards/{card_id}/toggle-status", json={"status": status})
        return await self._handle_response(resp)

    # === Question Management ===

    async def get_card_question(self, card_id: str) -> dict:
        resp = await self.client.get(f"/api/v1/cards/{card_id}/question")
        return await self._handle_response(resp)

    async def create_question(self, data: dict) -> dict:
        resp = await self.client.post("/api/v1/questions", json=data)
        return await self._handle_response(resp)

    async def get_question_detail(self, question_id: str) -> dict:
        resp = await self.client.get(f"/api/v1/questions/{question_id}")
        return await self._handle_response(resp)

    async def update_question(self, question_id: str, data: dict) -> dict:
        resp = await self.client.put(f"/api/v1/questions/{question_id}", json=data)
        return await self._handle_response(resp)

    async def delete_question(self, question_id: str) -> None:
        resp = await self.client.delete(f"/api/v1/questions/{question_id}")
        resp.raise_for_status()

    # === AI Generation ===

    async def generate_cards_sync(self, topics: list[str], chapter_id: str) -> dict:
        resp = await self.client.post("/api/v1/ai/generate-cards", json={
            "topics": topics,
            "chapter_id": chapter_id,
            "mode": "sync",
        }, timeout=120.0)
        return await self._handle_response(resp)

    async def generate_cards_async(self, topics: list[str], chapter_id: str) -> dict:
        resp = await self.client.post("/api/v1/ai/generate-cards", json={
            "topics": topics,
            "chapter_id": chapter_id,
            "mode": "async",
        }, timeout=10.0)
        return await self._handle_response(resp)

    async def get_generate_cards_result(self, task_id: str) -> dict:
        resp = await self.client.get(f"/api/v1/ai/generate-cards/{task_id}/result")
        return await self._handle_response(resp)

    async def generate_question(self, card_id: str, mode: str = "sync") -> dict:
        resp = await self.client.post(f"/api/v1/ai/generate-questions/{card_id}", json={
            "mode": mode,
        })
        return await self._handle_response(resp)

    # === Sensitive Words ===

    async def list_sensitive_words(self, page: int = 1, page_size: int = 20, keyword: str | None = None, match_mode: str | None = None) -> dict:
        params = {"page": page, "page_size": page_size}
        if keyword:
            params["keyword"] = keyword
        if match_mode:
            params["match_mode"] = match_mode
        resp = await self.client.get("/api/v1/sensitive-words", params=params)
        return await self._handle_response(resp)

    async def create_sensitive_word(self, data: dict) -> dict:
        resp = await self.client.post("/api/v1/sensitive-words", json=data)
        return await self._handle_response(resp)

    async def update_sensitive_word(self, word_id: str, data: dict) -> dict:
        resp = await self.client.put(f"/api/v1/sensitive-words/{word_id}", json=data)
        return await self._handle_response(resp)

    async def delete_sensitive_word(self, word_id: str) -> None:
        resp = await self.client.delete(f"/api/v1/sensitive-words/{word_id}")
        resp.raise_for_status()

    async def batch_delete_sensitive_words(self, ids: list[str]) -> None:
        resp = await self.client.post("/api/v1/sensitive-words/batch-delete", json={"ids": ids})
        resp.raise_for_status()

    async def toggle_sensitive_word(self, word_id: str, enabled: bool) -> dict:
        resp = await self.client.put(f"/api/v1/sensitive-words/{word_id}/toggle", json={"enabled": enabled})
        return await self._handle_response(resp)

    async def reload_sensitive_words(self) -> dict:
        resp = await self.client.post("/api/v1/sensitive-words/reload")
        return await self._handle_response(resp)

    # === Review Pipeline ===

    async def submit_review(self, note_id: str, title: str, content: str, author_id: str) -> dict:
        resp = await self.client.post(f"/api/v1/review/notes/{note_id}/submit", json={
            "note_id": note_id,
            "title": title,
            "content": content,
            "author_id": author_id,
        }, timeout=30.0)
        return await self._handle_response(resp)

    async def get_review_status(self, note_id: str) -> dict:
        resp = await self.client.get(f"/api/v1/review/notes/{note_id}/status")
        return await self._handle_response(resp)

    async def get_review_detail(self, note_id: str) -> dict:
        resp = await self.client.get(f"/api/v1/review/notes/{note_id}/detail")
        return await self._handle_response(resp)

    async def approve_review(self, review_id: str, reviewer: str) -> dict:
        resp = await self.client.post(f"/api/v1/review/notes/{review_id}/approve", json={
            "reviewer": reviewer,
        })
        return await self._handle_response(resp)

    async def reject_review(self, review_id: str, reviewer: str, reason: str) -> dict:
        resp = await self.client.post(f"/api/v1/review/notes/{review_id}/reject", json={
            "reviewer": reviewer,
            "reason": reason,
        })
        return await self._handle_response(resp)

    async def batch_approve_review(self, review_ids: list[str], reviewer: str) -> dict:
        resp = await self.client.post("/api/v1/review/batch-approve", json={
            "review_ids": review_ids,
            "reviewer": reviewer,
        })
        return await self._handle_response(resp)

    async def batch_reject_review(self, review_ids: list[str], reviewer: str, reason: str) -> dict:
        resp = await self.client.post("/api/v1/review/batch-reject", json={
            "review_ids": review_ids,
            "reviewer": reviewer,
            "reason": reason,
        })
        return await self._handle_response(resp)

    async def get_review_queue(self, page: int = 1, page_size: int = 20) -> dict:
        resp = await self.client.get("/api/v1/review/queue", params={"page": page, "page_size": page_size})
        return await self._handle_response(resp)

    async def get_review_records(self, status: str = "all", start_date: str | None = None, end_date: str | None = None) -> list[dict]:
        params = {"status": status}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        resp = await self.client.get("/api/v1/review/records", params=params)
        return await self._handle_response(resp)

    async def get_review_statistics(self) -> dict:
        resp = await self.client.get("/api/v1/review/statistics")
        return await self._handle_response(resp)
